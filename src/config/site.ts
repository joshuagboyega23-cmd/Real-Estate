type Testimonial = { name: string; role: string; quote: string };

export const site = {
  name: "Real Estate",
  tagline: "Find a place to call home and manage your property with confidence.",
  city: "Abuja",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  whatsapp: (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "").replace(/\D/g, ""),
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "",
  testimonials: [
    // { name: "Example Name", role: "Property owner", quote: "Example testimonial." },
  ] as Testimonial[],
};
