import { defineAction, z } from "astro:actions";
import { AzureKeyCredential } from "@azure/core-auth";
import { CommunicationIdentityClient } from "@azure/communication-identity";

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

const credential = new AzureKeyCredential(key);
const idClient = new CommunicationIdentityClient(endpoint, credential);

export const getComsToken = defineAction({
  input: z.string().nullable().optional(),
  handler: async (user) => {
    if (user) return idClient.getToken({ communicationUserId: user }, ["voip"]);
    return await idClient.createUserAndToken(["voip"]);
  },
});
