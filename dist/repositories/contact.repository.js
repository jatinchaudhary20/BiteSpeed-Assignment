"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRepository = void 0;
class ContactRepository {
    static async findByEmailOrPhone(tx, email, phoneNumber) {
        const orConditions = [];
        if (email) {
            orConditions.push({ email: { equals: email, mode: 'insensitive' } });
        }
        if (phoneNumber) {
            orConditions.push({ phoneNumber });
        }
        if (orConditions.length === 0)
            return [];
        return tx.contact.findMany({
            where: {
                OR: orConditions
            }
        });
    }
    static async findRelated(tx, ids) {
        if (ids.length === 0)
            return [];
        return tx.contact.findMany({
            where: {
                OR: [
                    { id: { in: ids } },
                    { linkedId: { in: ids } }
                ]
            }
        });
    }
    static async createContact(tx, data) {
        return tx.contact.create({
            data
        });
    }
    // Update a bunch of contacts to become secondary and point to the new primary
    static async updateToSecondary(tx, ids, primaryId) {
        if (ids.length === 0)
            return;
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
exports.ContactRepository = ContactRepository;
