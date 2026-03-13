"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const certificateGallery = [
  {
    id: 1,
    image: "/001.jpg",
    title: "Client Patent Certification",
    note: "Patent certificate granted to our client with filing support from PATENT-IPR.",
  },
];

function CertificateGalleryCard({ item, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${index * 100}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
      }}
      className="w-full max-w-[320px] mx-auto bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black text-[#0d1b2a] text-sm leading-tight">
            {item.title}
          </div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
            Client Success Story
          </div>
        </div>
        <span className="bg-[#4a7c59] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full whitespace-nowrap">
          Verified
        </span>
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-[#d6b24b] bg-[#f6f2e5] w-full max-w-[240px] mx-auto">
        <Image
          src={item.image}
          alt={item.title}
          width={240}
          height={120}
          className="w-full h-auto object-cover"
          priority
        />
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-1">
        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Description</div>
        <div className="text-xs font-semibold text-[#0d1b2a]">
          {item.note}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[#4a7c59]">
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-widest">
          Verified Client Patent Certificate
        </span>
      </div>
    </div>
  );
}

export default function SuccessStories() {
  const headingRef = useRef(null);
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeadingVisible(true);
      },
      { threshold: 0.2 }
    );
    if (headingRef.current) observer.observe(headingRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="success-stories" className="py-24 bg-[#f3f4f6]">
      <div className="max-w-7xl mx-auto px-6">
        <div
          ref={headingRef}
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#f5a623]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0d1b2a]">
              Success Stories
            </span>
          </div>
          <h2 className="text-4xl font-black text-[#0d1b2a] mb-4">
            Client Patent Certifications
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            Certificates granted to clients we helped file and prosecute.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {certificateGallery.map((item, i) => (
            <CertificateGalleryCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
