"use server";

import { signIn, signOut } from "@/auth";

export async function signInAction(): Promise<void> {
  await signIn("discord", { redirectTo: "/guilds" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
