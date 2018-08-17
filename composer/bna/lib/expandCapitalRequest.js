/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */

/**
 * Transaction for changing value of given stocks
 * @param {org.altinn.ExpandCapitalRequest} expandCapitalRequest - creating a new expand capital request
 * @transaction
 */
async function expandCapitalRequest(tx) {
  const namespace = CONFIG.composerNamespace;
  const factory = getFactory();

  try {
    let businessRegistryParticipantRegistry = await getParticipantRegistry(namespace + '.' + 'BusinessRegistry');
    let companyRegistry = await getParticipantRegistry(namespace + '.' + 'Company');

    let request = factory.newConcept(namespace, 'ResponseRequest');
    request.transactionID = tx.transactionId;
    request.request = 'CHANGEVALUE';
    request.response = 'PENDING';

    const allBusinessRegistries = await businessRegistryParticipantRegistry.getAll();
    businessRegistry = allBusinessRegistries[0];
    businessRegistry.receivedChangeOnCompanyRequest.push(request);

    await businessRegistryParticipantRegistry.update(businessRegistry);

    const company = await companyRegistry.get(tx.shareholderRegistryID);
    company.changeOnCompanyRequest.push(request);

    await companyRegistry.update(company);

    const event = factory.newEvent(namespace, 'ChangeOnCompanyRegistered');
    event.capitalChange = 'CHANGEVALUE';
    event.newCapital = tx.newCapital;
    event.shareholderRegistryID = tx.shareholderRegistryID;

    return emit(event);
  } catch (error) {
    throw new Error('[ExpandCapitalRequest] failed' + error);
  }
}
