import { Prisma, Contact } from '@prisma/client';

export class ContactRepository {
    static async findByEmailOrPhone(
        tx: Prisma.TransactionClient,
        email?: string,
        phoneNumber?: string
    ): Promise<Contact[]> {
        const orConditions: Prisma.ContactWhereInput[] = [];

        if (email) {
            orConditions.push({ email: { equals: email, mode: 'insensitive' } });
        }

        if (phoneNumber) {
            orConditions.push({ phoneNumber });
        }

        if (orConditions.length === 0) return [];

        return tx.contact.findMany({
            where: {
                OR: orConditions
            }
        });
    }

    static async findRelated(tx: Prisma.TransactionClient, ids: number[]): Promise<Contact[]> {
        if (ids.length === 0) return [];

        return tx.contact.findMany({
            where: {
                OR: [
                    { id: { in: ids } },
                    { linkedId: { in: ids } }
                ]
            }
        });
    }

    static async createContact(
        tx: Prisma.TransactionClient,
        data: Prisma.ContactUncheckedCreateInput
    ): Promise<Contact> {
        return tx.contact.create({
            data
        });
    }

    // Update a bunch of contacts to become secondary and point to the new primary
    static async updateToSecondary(
        tx: Prisma.TransactionClient,
        ids: number[],
        primaryId: number
    ): Promise<void> {
        if (ids.length === 0) return;

        await tx.contact.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                linkPrecedence: 'secondary',
                linkedId: primaryId,
                updatedAt: new Date()
            }
        });
    }
}
