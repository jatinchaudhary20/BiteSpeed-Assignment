import { ContactRepository } from '../repositories/contact.repository';
import { prisma } from '../utils/db';
import { Contact } from '@prisma/client';
import { Prisma } from '@prisma/client'; // Added this import for Prisma.TransactionClient

export class IdentityService {
    static async reconcile(email?: string, phoneNumber?: string) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Find direct matches
            const directMatches = await ContactRepository.findByEmailOrPhone(tx, email, phoneNumber);

            if (directMatches.length === 0) {
                // No matches -> create a new primary contact
                const newContact = await ContactRepository.createContact(tx, {
                    email,
                    phoneNumber,
                    linkPrecedence: 'primary',
                });
                return this.formatResponse([newContact], newContact.id);
            }

            // 2. Extract IDs to find the complete linked cluster
            const clusterIds = new Set<number>();
            for (const c of directMatches) {
                clusterIds.add(c.id);
                if (c.linkedId) {
                    clusterIds.add(c.linkedId);
                }
            }

            // Fetch all records associated with these IDs
            const allRelatedContacts = await ContactRepository.findRelated(tx, Array.from(clusterIds));

            // 3. Find all primary contacts in this cluster
            let primaries = allRelatedContacts.filter(c => c.linkPrecedence === 'primary');

            // Fallback in case of inconsistent data (no primary)
            if (primaries.length === 0) {
                const oldest = [...allRelatedContacts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
                primaries = [oldest];
            }

            // 4. Identify the ultimate primary (oldest creation date)
            primaries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            const ultimatePrimary = primaries[0];
            const otherPrimaries = primaries.slice(1);

            // 5. Update other primaries AND any incorrect secondaries
            const updateIds = new Set<number>();

            // Update the other primaries to become secondary
            otherPrimaries.forEach(p => updateIds.add(p.id));

            // Update any contact that points to one of the other primaries, or is secondary but doesn't point to ultimate
            const wrongSecondaries = allRelatedContacts.filter(c =>
                c.id !== ultimatePrimary.id &&
                c.linkPrecedence === 'secondary' &&
                c.linkedId !== ultimatePrimary.id
            );
            wrongSecondaries.forEach(s => updateIds.add(s.id));

            if (updateIds.size > 0) {
                await ContactRepository.updateToSecondary(tx, Array.from(updateIds), ultimatePrimary.id);
            }

            // Fetch the refreshed cluster
            // We know all related records will either be the ultimatePrimary, or have a linkedId of ultimatePrimary
            const updatedCluster = await ContactRepository.findRelated(tx, [ultimatePrimary.id]);

            // 6. Check if new info is presented
            const clusterEmails = updatedCluster.map(c => c.email).filter(e => e !== null) as string[];
            const clusterPhones = updatedCluster.map(c => c.phoneNumber).filter(p => p !== null) as string[];

            const hasNewEmail = email && !clusterEmails.some(e => e.toLowerCase() === email.toLowerCase());
            const hasNewPhone = phoneNumber && !clusterPhones.includes(phoneNumber);

            if (hasNewEmail || hasNewPhone) {
                // Create new secondary contact containing the info
                const newSecondary = await ContactRepository.createContact(tx, {
                    email,
                    phoneNumber,
                    linkedId: ultimatePrimary.id,
                    linkPrecedence: 'secondary'
                });
                updatedCluster.push(newSecondary);
            }

            // 7. Format the output
            return this.formatResponse(updatedCluster, ultimatePrimary.id);
        });
    }

    private static formatResponse(cluster: Contact[], primaryId: number) {
        const emails = new Set<string>();
        const phoneNumbers = new Set<string>();
        const secondaryContactIds: number[] = [];

        // Ensure primary contact's email and phone are first in the list
        const primary = cluster.find(c => c.id === primaryId);
        if (primary) {
            if (primary.email) emails.add(primary.email);
            if (primary.phoneNumber) phoneNumbers.add(primary.phoneNumber);
        }

        // Sort to make sure we iterate over secondaries chronologically for consistent order
        const secondaries = cluster.filter(c => c.id !== primaryId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        for (const contact of secondaries) {
            if (contact.email) emails.add(contact.email);
            if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
            secondaryContactIds.push(contact.id);
        }

        return {
            primaryContatctId: primaryId, // Specified strictly by the requirement spelling
            emails: Array.from(emails),
            phoneNumbers: Array.from(phoneNumbers),
            secondaryContactIds
        };
    }
}
