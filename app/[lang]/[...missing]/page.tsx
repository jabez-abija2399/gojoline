import { notFound } from "next/navigation";

/** Any address no page matches: show the branded "page not found" inside the language layout. */
export default function Missing() {
  notFound();
}
