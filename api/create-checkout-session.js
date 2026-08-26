const Stripe = require("stripe");

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);

const OFFER_PRICES = {
    parigi: 14900,
    barcellona: 12900,
    budapest: 9900,
    maldive: 169900
};

const OFFER_NAMES = {
    parigi: "Parigi — Weekend",
    barcellona: "Barcellona — Weekend",
    budapest: "Budapest — Weekend",
    maldive: "Maldive — Vacanza"
};

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Metodo non consentito"
        });
    }

    try {

        const body = req.body || {};

        const {
            offer,
            customer,
            trip,
            traveler,
            notes,
            marketing
        } = body;

        if (!offer || !OFFER_PRICES[offer]) {
            return res.status(400).json({
                error: "Offerta non valida."
            });
        }

        if (
            !customer ||
            !customer.firstName ||
            !customer.lastName ||
            !customer.email
        ) {
            return res.status(400).json({
                error: "Dati cliente incompleti."
            });
        }

        const unitAmount = OFFER_PRICES[offer];

        const productName = OFFER_NAMES[offer];

        const adults = Number(
            trip?.adults || 1
        );

        if (adults < 1 || adults > 6) {
            return res.status(400).json({
                error: "Numero viaggiatori non valido."
            });
        }

        const session =
            await stripe.checkout.sessions.create({

                mode: "payment",

                line_items: [
                    {
                        price_data: {
                            currency: "eur",

                            product_data: {
                                name: productName
                            },

                            unit_amount: unitAmount
                        },

                        quantity: adults
                    }
                ],

                customer_email:
                    customer.email,

                billing_address_collection:
                    "required",

                success_url:
                    "https://scappavia.com/success.html?session_id={CHECKOUT_SESSION_ID}",

                cancel_url:
                    "https://scappavia.com/prenotazione.html?offerta=" +
                    encodeURIComponent(offer),

                metadata: {

                    offer,

                    customerFirstName:
                        customer.firstName,

                    customerLastName:
                        customer.lastName,

                    customerEmail:
                        customer.email,

                    phone:
                        customer.phone || "",

                    departure:
                        trip?.departure || "",

                    startDate:
                        trip?.startDate || "",

                    endDate:
                        trip?.endDate || "",

                    adults:
                        String(adults),

                    children:
                        String(
                            trip?.children || 0
                        ),

                    travelerFirstName:
                        traveler?.firstName || "",

                    travelerLastName:
                        traveler?.lastName || "",

                    notes:
                        String(
                            notes || ""
                        ).slice(0, 450),

                    marketing:
                        marketing
                            ? "yes"
                            : "no"
                }
            });

        return res.status(200).json({
            url: session.url,
            sessionId: session.id
        });

    } catch (error) {

        console.error(
            "Stripe error:",
            error
        );

        return res.status(500).json({
            error:
                "Errore nella creazione del pagamento."
        });
    }
};
