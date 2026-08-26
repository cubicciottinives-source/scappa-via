const Stripe = require("stripe");

module.exports = async function handler(req, res) {

    /*
     * SOLO POST
     */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Metodo non consentito."
        });

    }


    /*
     * CONTROLLO CHIAVE STRIPE
     */

    const secretKey =
        process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {

        console.error(
            "STRIPE_SECRET_KEY non configurata su Vercel."
        );

        return res.status(500).json({
            error:
                "Stripe non è configurato correttamente su Vercel."
        });

    }


    /*
     * INIZIALIZZA STRIPE
     */

    const stripe =
        new Stripe(secretKey);


    /*
     * PREZZI DELLE OFFERTE
     *
     * Gli importi sono in centesimi.
     */

    const OFFER_PRICES = {

        parigi: 14900,

        barcellona: 12900,

        budapest: 9900,

        maldive: 169900

    };


    /*
     * NOMI DELLE OFFERTE
     */

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
         * CONTROLLO OFFERTA
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
         * CONTROLLO CLIENTE
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


        /*
         * CONTROLLO EMAIL
         */

        const email =
            String(customer.email)
                .trim();


        if (
            !email.includes("@") ||
            !email.includes(".")
        ) {

            return res.status(400).json({
                error:
                    "Email non valida."
            });

        }


        /*
         * ADULTI
         */

        const adults =
            Number(
                trip &&
                trip.adults
                    ? trip.adults
                    : 1
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
                trip &&
                trip.children
                    ? trip.children
                    : 0
            );


        /*
         * PREZZO
         */

        const unitAmount =
            OFFER_PRICES[offer];


        const productName =
            OFFER_NAMES[offer];


        /*
         * URL DI RITORNO
         */

        const successUrl =
            "https://scappavia.com/success.html" +
            "?session_id={CHECKOUT_SESSION_ID}";


        const cancelUrl =
            "https://scappavia.com/prenotazione.html" +
            "?offerta=" +
            encodeURIComponent(offer);


        /*
         * CREA SESSIONE STRIPE
         */

        const session =
            await stripe.checkout.sessions.create({

                mode: "payment",


                /*
                 * PRODOTTO
                 */

                line_items: [

                    {

                        price_data: {

                            currency: "eur",

                            product_data: {

                                name:
                                    productName

                            },

                            unit_amount:
                                unitAmount

                        },

                        quantity:
                            adults

                    }

                ],


                /*
                 * EMAIL CLIENTE
                 */

                customer_email:
                    email,


                /*
                 * INDIRIZZO DI FATTURAZIONE
                 */

                billing_address_collection:
                    "required",


                /*
                 * METODI DI PAGAMENTO
                 *
                 * Stripe mostrerà i metodi
                 * compatibili con il tuo account.
                 */

                payment_method_types: [
                    "card"
                ],


                /*
                 * PAGINA SUCCESSO
                 */

                success_url:
                    successUrl,


                /*
                 * ANNULLAMENTO
                 */

                cancel_url:
                    cancelUrl,


                /*
                 * DATI DELLA PRENOTAZIONE
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

            success: true,

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


        /*
         * RESTITUISCE L'ERRORE REALE
         * DURANTE IL TEST
         */

        return res.status(500).json({

            error:
                error?.message ||
                "Errore nella creazione del pagamento."

        });

    }

};
