"use server";

import { revalidatePath } from "next/cache";

export default async function loginModalSuccess() {
  return revalidatePath("/property-search");
}
