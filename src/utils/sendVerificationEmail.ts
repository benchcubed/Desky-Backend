import { SendEmailCommand } from "@aws-sdk/client-ses";
import { BASE_EMAIL_FROM, sesClient } from "../clients/ses";

export const sendVerificationEmail = async (email: string, token: string) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const params = {
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Text: {
                    Data: `Please verify your email by clicking the link: ${verificationUrl}`,
                },
            },
            Subject: {
                Data: "Verify your email",
            },
        },
        Source: BASE_EMAIL_FROM,
    };

    const command = new SendEmailCommand(params);

    try {
        await sesClient.send(command);
    } catch (err) {
        console.error("Error sending verification email:", err);
        throw err;
    }
};
