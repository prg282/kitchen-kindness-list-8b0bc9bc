import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'bakery',
  'beverages',
  'spices',
  'other',
] as const;

const SYSTEM_PROMPT = `You turn recipes into a South African grocery shopping list.
Extract every ingredient the shopper must buy. Rules:
- Use plain shopping names ("chicken breasts", not "2 chicken breasts, diced").
- Put the amount in "quantity" (e.g. "500 g", "2", "1 tin"). Leave it empty if unknown.
- Use South African English and local product names where natural (mince, brinjal, baby marrow, mielies).
- Skip water, ice and anything that is not bought at a shop.
- Merge duplicates into one line with a combined quantity.
- Assign each item exactly one category from the allowed list.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return json({ error: 'AI is not configured for this project.' }, 500);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body.' }, 400);
    }

    const recipe = typeof body?.recipe === 'string' ? body.recipe.trim() : '';
    if (recipe.length < 10) {
      return json({ error: 'Please paste a recipe with a bit more detail.' }, 400);
    }
    if (recipe.length > 12000) {
      return json({ error: 'That recipe is too long. Please paste up to 12 000 characters.' }, 400);
    }

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Recipe:\n\n${recipe}` },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_shopping_list',
              description: 'Return the shopping list extracted from the recipe.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: {
                    type: ['string', 'null'],
                    description: 'Short name of the recipe, or null if unknown.',
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        name: { type: 'string' },
                        quantity: { type: ['string', 'null'] },
                        category: { type: 'string', enum: CATEGORIES as unknown as string[] },
                      },
                      required: ['name', 'quantity', 'category'],
                    },
                  },
                },
                required: ['title', 'items'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_shopping_list' } },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('AI gateway error', res.status, detail);
      if (res.status === 429) {
        return json({ error: 'Too many requests right now. Please try again in a moment.' }, 429);
      }
      if (res.status === 402) {
        return json({ error: 'AI credits are exhausted. Please top up to keep using this feature.' }, 402);
      }
      return json({ error: 'Could not read that recipe. Please try again.' }, 502);
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = null;
    if (call?.function?.arguments) {
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch {
        parsed = null;
      }
    }

    if (!parsed?.items || !Array.isArray(parsed.items)) {
      return json({ error: 'No ingredients found in that recipe.' }, 422);
    }

    const items = parsed.items
      .filter((i: any) => typeof i?.name === 'string' && i.name.trim())
      .slice(0, 60)
      .map((i: any) => ({
        name: String(i.name).trim().slice(0, 80),
        quantity: i.quantity ? String(i.quantity).trim().slice(0, 40) : null,
        category: CATEGORIES.includes(i.category) ? i.category : 'other',
      }));

    if (items.length === 0) {
      return json({ error: 'No ingredients found in that recipe.' }, 422);
    }

    return json({ title: parsed.title ?? null, items });
  } catch (err) {
    console.error('recipe-to-list failed', err);
    return json({ error: 'Something went wrong reading that recipe.' }, 500);
  }
});
