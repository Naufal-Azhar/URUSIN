import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "@/app/(auth)/masuk/sign-in-form";

const { signInMock, pushMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("SignInForm", () => {
  beforeEach(() => {
    signInMock.mockReset();
    pushMock.mockReset();
  });

  it("menampilkan error validasi untuk email tidak valid", async () => {
    const user = userEvent.setup();
    render(<SignInForm callbackUrl="/dashboard" />);

    await user.type(screen.getByLabelText("Email"), "bukan-email");
    await user.click(screen.getByRole("button", { name: "Kirim tautan masuk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Format email tidak valid.");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("mengirim email ternormalisasi dan menampilkan pesan aman saat gagal", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: false, error: "RateLimit" });
    render(<SignInForm callbackUrl="/dashboard" />);

    await user.type(screen.getByLabelText("Email"), "Budi@Example.COM");
    await user.click(screen.getByRole("button", { name: "Kirim tautan masuk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Tautan masuk belum dapat dikirim");
    expect(signInMock).toHaveBeenCalledWith(
      "email",
      expect.objectContaining({
        email: "budi@example.com",
        callbackUrl: "/dashboard",
        redirect: false,
      }),
    );
  });
});
