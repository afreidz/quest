import {
  AccountSASPermissions,
  AccountSASResourceTypes,
  AccountSASServices,
  StorageSharedKeyCredential,
  generateAccountSASQueryParameters,
} from "@azure/storage-blob";

import { defineAction, z } from "astro:actions";
import { Temporal } from "@js-temporal/polyfill";
import { AzureKeyCredential } from "@azure/core-auth";
import { CommunicationIdentityClient } from "@azure/communication-identity";

const comsKey = import.meta.env.AZURE_COMS_KEY;
const comsEndpoint = import.meta.env.AZURE_COMS_ENDPOINT;
const storageKey = import.meta.env.AZURE_STORAGE_ACCOUNT_KEY;
const storageAccount = import.meta.env.PUBLIC_STORAGE_ACCOUNT;

const comsCredential = new AzureKeyCredential(comsKey);
const comsClient = new CommunicationIdentityClient(
  comsEndpoint,
  comsCredential,
);

const storageCredential = new StorageSharedKeyCredential(
  storageAccount,
  storageKey,
);

export const getComsToken = defineAction({
  input: z.string().nullable().optional(),
  handler: async (user) => {
    if (user)
      return comsClient.getToken({ communicationUserId: user }, ["voip"]);
    return await comsClient.createUserAndToken(["voip"]);
  },
});

export const getBlobToken = defineAction({
  handler: async () => {
    const expiresOn = new Date(+new Date() + 1000 * 60 * 60 * 24);

    const permissions = AccountSASPermissions.parse("rwdlacupi");
    const services = AccountSASServices.parse("btqf").toString();
    const resourceTypes = AccountSASResourceTypes.parse("sco").toString();

    const qs = generateAccountSASQueryParameters(
      {
        services,
        expiresOn,
        permissions,
        resourceTypes,
      },
      storageCredential,
    );

    return qs.toString();
  },
});
