const Stripe = require("stripe");

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);


/*
 * CORS
 */

function setCors(res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "https://scappavia.com"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    res.setHeader(
        "Access-Control-Allow-Credentials",
        "true"
    );
}


/*
 * OFFERTE
 */

const OFFER_PRICES = {

    parigi: 14900,

    barcellona: 12900,

    budapest: 9900,

    maldive: 169900

};


const OFFER_NAMES = {

    parigi:
        "Parigi — Weekend",

    barcellona:
        "Barcellona — Weekend",

    budapest:
        "Budapest — Weekend",

    maldive:
        "Maldive — Vacanza"

};


/*
 * FUNZIONE
 */

module.exports = async function handler(req, res) {

    /*
     * CORS
     */

    setCors(res);


    /*
     * PREFLIGHT DEL BROWSER
     */

    if (req.method === "OPTIONS") {

        return res.status(204).end();

    }


    /*
     * SOLO POST
     */

    if (req.method !== "POST") {

        return res.status(405).json({

            error:
                "Metodo non consentito."

        });

    }


    /*
     * CONTROLLO STRIPE
     */

    const secretKey =
        process.env.STRIPE_SECRET_KEY;


    if (!secretKey) {

        console.error(
            "STRIPE_SECRET_KEY mancante."
        );

        return res.status(500).json({

            error:
                "Stripe non è configurato correttamente su Vercel."

        });

    }


    try {

        /*
         * BODY
         */

        const body =
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : (req.body || {});


        const {
            offer,
            customer,
            trip,
            traveler,
            notes,
            marketing
        } = body;


        /*
         * OFFERTA
         */

        if (
            !offer ||
            !Object.prototype.hasOwnProperty.call(
                OFFER_PRICES,
                offer
            )
        ) {

            return res.status(400).json({

                error:
                    "Offerta non valida."

            });

        }


        /*
         * CLIENTE
         */

        if (
            !customer ||
            !customer.firstName ||
            !customer.lastName ||
            !customer.email
        ) {

            return res.status(400).json({

                error:
                    "Dati cliente incompleti."

            });

        }


        const email =
            String(
                customer.email
            ).trim();


        /*
         * ADULTI
         */

        const adults =
            Number(
                trip?.adults || 1
            );


        if (
            !Number.isInteger(adults) ||
            adults < 1 ||
            adults > 6
        ) {

            return res.status(400).json({

                error:
                    "Numero di adulti non valido."

            });

        }


        /*
         * BAMBINI
         */

        const children =
            Number(
                trip?.children || 0
            );


        /*
         * CREA CHECKOUT STRIPE
         */

        const session =
            await stripe.checkout.sessions.create({

                mode:
                    "payment",


                line_items: [

                    {

                        price_data: {

                            currency:
                                "eur",

                            product_data: {

                                name:
                                    OFFER_NAMES[offer]

                            },

                            unit_amount:
                                OFFER_PRICES[offer]

                        },

                        quantity:
                            adults

                    }

                ],


                customer_email:
                    email,


                billing_address_collection:
                    "required",


                /*
                 * PER ORA CARTA
                 * Stripe TEST
                 */

                payment_method_types: [

                    "card"

                ],


                /*
                 * SUCCESSO
                 */

                success_url:
                    "https://scappavia.com/success.html" +
                    "?session_id={CHECKOUT_SESSION_ID}",


                /*
                 * ANNULLAMENTO
                 */

                cancel_url:
                    "https://scappavia.com/prenotazione.html" +
                    "?offerta=" +
                    encodeURIComponent(offer),


                /*
                 * DATI PRENOTAZIONE
                 */

                metadata: {

                    offer:
                        String(offer),

                    customerFirstName:
                        String(
                            customer.firstName
                        ).slice(0, 450),

                    customerLastName:
                        String(
                            customer.lastName
                        ).slice(0, 450),

                    customerEmail:
                        email.slice(0, 450),

                    phone:
                        String(
                            customer.phone || ""
                        ).slice(0, 450),

                    departure:
                        String(
                            trip?.departure || ""
                        ).slice(0, 450),

                    destination:
                        String(
                            trip?.destination || ""
                        ).slice(0, 450),

                    startDate:
                        String(
                            trip?.startDate || ""
                        ).slice(0, 450),

                    endDate:
                        String(
                            trip?.endDate || ""
                        ).slice(0, 450),

                    adults:
                        String(adults),

                    children:
                        String(children),

                    travelerFirstName:
                        String(
                            traveler?.firstName || ""
                        ).slice(0, 450),

                    travelerLastName:
                        String(
                            traveler?.lastName || ""
                        ).slice(0, 450),

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


        /*
         * RISPOSTA
         */

        return res.status(200).json({

            success:
                true,

            url:
                session.url,

            sessionId:
                session.id

        });


    } catch (error) {

        console.error(
            "ERRORE STRIPE:",
            error
        );


        return res.status(500).json({

            error:
                error?.message ||
                "Errore nella creazione del pagamento."

        });

    }

};
