import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { origin, destination, departureDate, adults } = await req.json();

  const token = process.env.DUFFEL_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 500 });
  }

  try {
    const offerRes = await fetch("https://api.duffel.com/air/offer_requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          slices: [
            {
              origin,
              destination,
              departure_date: departureDate,
            },
          ],
          passengers: Array(adults).fill({ type: "adult" }),
          cabin_class: "economy",
        },
      }),
    });

    const offerData = await offerRes.json();

    if (!offerRes.ok) {
      console.error("Duffel error:", offerData);
      return NextResponse.json({ error: offerData }, { status: 500 });
    }

    const offers = offerData.data?.offers?.slice(0, 10).map((offer: any) => ({
      id: offer.id,
      price: offer.total_amount,
      currency: offer.total_currency,
      airline: offer.slices?.[0]?.segments?.[0]?.operating_carrier?.name,
      departure: offer.slices?.[0]?.segments?.[0]?.departing_at,
      arrival: offer.slices?.[0]?.segments?.[offer.slices[0].segments.length - 1]?.arriving_at,
      stops: offer.slices?.[0]?.segments?.length - 1,
      duration: offer.slices?.[0]?.duration,
    }));

    return NextResponse.json({ offers });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
