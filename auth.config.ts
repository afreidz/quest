import { defineConfig } from "auth-astro";
import Entra from "@auth/core/providers/microsoft-entra-id";

export default defineConfig({
  providers: [
    Entra({
      clientId: import.meta.env.AZURE_AD_CLIENT_ID,
      tenantId: import.meta.env.AZURE_AD_TENNANT_ID,
      clientSecret: import.meta.env.AZURE_AD_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
});
