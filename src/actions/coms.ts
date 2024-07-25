import { defineAction, z } from "astro:actions";
import { AzureKeyCredential } from "@azure/core-auth";
import { CommunicationIdentityClient } from "@azure/communication-identity";

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

const getCommsToken = defineAction({
  input: z.string().optional(),
  handler: async (user) => {
    const credential = new AzureKeyCredential(key);
    const client = new CommunicationIdentityClient(endpoint, credential);

    if (user) return client.getToken({ communicationUserId: user }, ["voip"]);

    return await client.createUserAndToken(["voip"]);
  },
});

export default getCommsToken;
