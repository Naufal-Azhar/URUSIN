import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Check,
  FileCheck2,
  IdCard,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = [
  {
    slug: "ktp",
    name: "KTP",
    detail: "Perekaman, hilang, atau rusak",
    icon: IdCard,
    tone: "mint",
    number: "01",
  },
  {
    slug: "kk",
    name: "Kartu Keluarga",
    detail: "Keluarga baru atau perubahan data",
    icon: UsersRound,
    tone: "peach",
    number: "02",
  },
  {
    slug: "sim",
    name: "SIM",
    detail: "Perpanjangan SIM A dan SIM C",
    icon: FileCheck2,
    tone: "lilac",
    number: "03",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles aria-hidden="true" /> Teman urus dokumen warga Batam
          </div>
          <h1 id="hero-heading">
            Satu per satu.
            <br />
            <span>Sampai beres.</span>
          </h1>
          <p className="hero-description">
            Bingung mulai dari mana? Temukan panduan, siapkan yang perlu, lalu lanjutkan lewat kanal
            resmi. Semua urusanmu lebih tertata di satu tempat.
          </p>
          <form action="/layanan" method="get" className="hero-search">
            <label htmlFor="q" className="sr-only">
              Cari layanan
            </label>
            <Search aria-hidden="true" className="search-icon" />
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Coba “KTP hilang” atau “buat KK”"
              autoComplete="off"
              maxLength={80}
            />
            <Button type="submit" size="md">
              Cari panduan <ArrowRight aria-hidden="true" />
            </Button>
          </form>
          <div className="hero-assurance">
            <ShieldCheck aria-hidden="true" /> Panduan persiapan mandiri, gratis, dan tanpa unggah
            dokumen
          </div>
        </div>

        <div className="hero-art" aria-label="Ilustrasi checklist persiapan dokumen">
          <div className="art-sun" />
          <div className="art-spark art-spark-one">✳</div>
          <div className="art-spark art-spark-two">✦</div>
          <div className="art-card-back" />
          <div className="art-document">
            <div className="art-document-top">
              <span className="art-mark">
                <FileCheck2 aria-hidden="true" />
              </span>
              <span className="art-tag">RUANG PERSIAPAN</span>
            </div>
            <div className="art-title-line" />
            <div className="art-subtitle-line" />
            <div className="art-check-row">
              <span>
                <Check aria-hidden="true" />
              </span>
              <i />
              <b />
            </div>
            <div className="art-check-row">
              <span>
                <Check aria-hidden="true" />
              </span>
              <i />
              <b />
            </div>
            <div className="art-check-row muted">
              <span />
              <i />
              <b />
            </div>
            <div className="art-progress">
              <div>
                <span>Progres persiapan</span>
                <strong>2 dari 3</strong>
              </div>
              <span className="progress-track">
                <i />
              </span>
            </div>
          </div>
          <div className="art-note">
            <span className="note-icon">
              <BadgeCheck aria-hidden="true" />
            </span>
            <span>
              <strong>Pelan-pelan saja</strong>
              <small>Satu langkah setiap kali</small>
            </span>
            <ArrowDownRight aria-hidden="true" className="note-arrow" />
          </div>
          <div className="art-caption">
            RAPIH DARI AWAL <span>•</span> LEBIH TENANG DI AKHIR
          </div>
        </div>
      </section>

      <section className="category-section" aria-labelledby="kategori-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker">MULAI DARI KEBUTUHANMU</span>
            <h2 id="kategori-heading">Urusan apa hari ini?</h2>
          </div>
          <Link href="/layanan" className="all-services">
            Lihat semua layanan <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map(({ slug, name, detail, icon: Icon, tone, number }) => (
            <Link key={slug} href={`/layanan?kategori=${slug}`} className={`category-card ${tone}`}>
              <div className="category-card-top">
                <span className="category-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="category-number">{number}</span>
              </div>
              <div>
                <h3>{name}</h3>
                <p>{detail}</p>
              </div>
              <span className="category-arrow">
                <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
        <p className="catalog-note">
          <span className="note-dot" /> Layanan ditampilkan setelah sumber resminya diperiksa dan
          diverifikasi.
        </p>
      </section>

      <section className="how-section" aria-labelledby="cara-heading">
        <div className="how-heading">
          <span className="section-kicker">NGGAK HARUS RIBET</span>
          <h2 id="cara-heading">Mulai dengan langkah kecil.</h2>
          <p>URUSIN bantu merapikan persiapan. Keputusan dan pengajuan tetap di tanganmu.</p>
        </div>
        <ol className="how-steps">
          <li>
            <span className="step-number">01</span>
            <div>
              <h3>Temukan panduan</h3>
              <p>Cari dengan kata sehari-hari atau pilih kategori.</p>
            </div>
          </li>
          <li>
            <span className="step-number">02</span>
            <div>
              <h3>Siapkan perlahan</h3>
              <p>Ikuti checklist dan tandai progres pribadimu.</p>
            </div>
          </li>
          <li>
            <span className="step-number">03</span>
            <div>
              <h3>Lanjut ke kanal resmi</h3>
              <p>Ajukan sendiri melalui instansi yang berwenang.</p>
            </div>
          </li>
        </ol>
      </section>
      <p className="privacy-note">
        <ShieldCheck aria-hidden="true" /> Dokumen identitasmu tetap milikmu. Kamu tidak perlu
        mengunggah KTP, KK, atau SIM ke URUSIN.
      </p>
    </div>
  );
}
