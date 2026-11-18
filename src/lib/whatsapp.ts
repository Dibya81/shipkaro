import { contact } from "@/config/site";

/** Build a wa.me link to the ShipKaro WhatsApp number with a pre-filled message. */
export function whatsappLink(message: string = contact.whatsappDefaultMessage) {
  const number = contact.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const instagramLink = `https://instagram.com/${contact.instagram}`;
export const emailLink = `mailto:${contact.email}`;
