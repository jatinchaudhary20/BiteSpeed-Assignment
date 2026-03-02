import { Request, Response } from 'express';
import { IdentityService } from '../services/identity.service';

export const identify = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phoneNumber } = req.body;

        // Validate request body
        if (!email && !phoneNumber) {
            res.status(400).json({
                error: "At least one of 'email' or 'phoneNumber' must be provided.",
            });
            return;
        }

        const emailStr = typeof email === 'string' ? email : undefined;
        const phoneStr = typeof phoneNumber === 'number' ? phoneNumber.toString() : typeof phoneNumber === 'string' ? phoneNumber : undefined;

        if (!emailStr && !phoneStr) {
            res.status(400).json({
                error: "Invalid format for 'email' or 'phoneNumber'.",
            });
            return;
        }

        const result = await IdentityService.reconcile(emailStr, phoneStr);

        res.status(200).json({
            contact: result
        });
    } catch (error) {
        console.error('Error during identification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
