import "server-only";
import { createConnection, type Socket } from "node:net";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";

export type LocalMail = {
  to: string;
  from: string;
  subject: string;
  text: string;
};

const SMTP_TIMEOUT_MS = 5_000;

function isLoopbackHost(host: string) {
  const value = host.toLowerCase();
  return value === "127.0.0.1" || value === "::1" || value === "localhost";
}

function assertHeaderSafe(value: string, label: string) {
  if (/[\r\n]/.test(value)) {
    throw new Error(`Nilai ${label} mengandung karakter header yang tidak valid.`);
  }
}

function extractAddress(value: string) {
  const match = /<([^>]+)>/.exec(value);
  const address = (match?.[1] ?? value).trim();
  assertHeaderSafe(address, "alamat email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error("Alamat email pengirim tidak valid.");
  }
  return address;
}

function encodeSubject(subject: string) {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export function buildMimeMessage(mail: LocalMail) {
  assertHeaderSafe(mail.to, "penerima");
  assertHeaderSafe(mail.subject, "subjek");
  extractAddress(mail.from);

  const headers = [
    `From: ${mail.from}`,
    `To: ${mail.to}`,
    `Subject: ${encodeSubject(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@urusin.local>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
  ];

  return `${headers.join("\r\n")}\r\n\r\n${mail.text.replace(/\r?\n/g, "\r\n")}`;
}

export function dotStuffMessage(message: string) {
  return message
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

class SmtpSession {
  private buffer = "";
  private queuedLines: string[] = [];
  private waiters: Array<(line: string) => void> = [];

  constructor(private readonly socket: Socket) {
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.pump();
    });
  }

  private pump() {
    let index = this.buffer.indexOf("\r\n");
    while (index >= 0) {
      const line = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + 2);
      const waiter = this.waiters.shift();
      if (waiter) {
        waiter(line);
      } else {
        this.queuedLines.push(line);
      }
      index = this.buffer.indexOf("\r\n");
    }
  }

  private readLine(): Promise<string> {
    const queued = this.queuedLines.shift();
    if (queued !== undefined) return Promise.resolve(queued);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(new Error("SMTP timeout."));
      }, SMTP_TIMEOUT_MS);

      const waiter = (line: string) => {
        clearTimeout(timer);
        resolve(line);
      };

      this.waiters.push(waiter);
    });
  }

  async readResponse() {
    const first = await this.readLine();
    const code = Number(first.slice(0, 3));
    const lines = [first];

    if (Number.isNaN(code)) throw new Error("Respons SMTP tidak valid.");

    if (first[3] === "-") {
      while (true) {
        const next = await this.readLine();
        lines.push(next);
        if (next.startsWith(`${code} `)) break;
      }
    }

    return { code, lines };
  }

  async expectGreeting() {
    const response = await this.readResponse();
    if (response.code !== 220) throw new Error(`SMTP greeting gagal (${response.code}).`);
  }

  async command(command: string, expected: number[]) {
    this.socket.write(`${command}\r\n`);
    const response = await this.readResponse();
    if (!expected.includes(response.code)) {
      throw new Error(`SMTP ${command.slice(0, 4)} gagal (${response.code}).`);
    }
    return response;
  }

  writeData(message: string) {
    this.socket.write(`${dotStuffMessage(message)}\r\n.\r\n`);
  }
}

function waitForConnect(socket: Socket) {
  return new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      socket.off("connect", onConnect);
      reject(error);
    };
    const onConnect = () => {
      socket.off("error", onError);
      resolve();
    };
    socket.once("error", onError);
    socket.once("connect", onConnect);
  });
}

export async function sendLocalMail(mail: LocalMail) {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Transport email produksi belum dikonfigurasi. Gunakan provider yang disetujui owner.",
    );
  }

  if (env.EMAIL_TRANSPORT !== "mailpit") {
    throw new Error("Transport email tidak didukung.");
  }

  if (!isLoopbackHost(env.EMAIL_SERVER_HOST)) {
    throw new Error("Mailpit hanya diizinkan pada host loopback.");
  }

  const socket = createConnection({
    host: env.EMAIL_SERVER_HOST,
    port: env.EMAIL_SERVER_PORT,
  });
  socket.setTimeout(SMTP_TIMEOUT_MS, () => {
    socket.destroy(new Error("SMTP socket timeout."));
  });

  try {
    await waitForConnect(socket);
    const session = new SmtpSession(socket);
    await session.expectGreeting();
    await session.command("EHLO localhost", [250]);

    const fromAddress = extractAddress(mail.from);
    await session.command(`MAIL FROM:<${fromAddress}>`, [250]);
    await session.command(`RCPT TO:<${mail.to}>`, [250, 251]);
    await session.command("DATA", [354]);
    session.writeData(buildMimeMessage(mail));
    const dataResponse = await session.readResponse();
    if (dataResponse.code !== 250) {
      throw new Error(`SMTP DATA gagal (${dataResponse.code}).`);
    }
    await session.command("QUIT", [221]);
  } finally {
    socket.destroy();
  }
}
