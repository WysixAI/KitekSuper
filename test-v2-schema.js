const payload = {
  flags: 32768,
  components: [
    {
      type: 10,
      content: "📢 Witajcie kotki! Mamy dla Was ważne ogłoszenie."
    },
    {
      type: 17,
      accent_color: 1096065,
      spoiler: false,
      components: [
        {
          type: 9,
          components: [
            {
              type: 10,
              content: "# 🌟 Ważna aktualizacja serwera!\nPrzygotowaliśmy dla Was zupełnie nowe funkcje, w tym odświeżony system ról i powiadomień.\nKliknij przyciski poniżej, aby odebrać nagrody."
            }
          ],
          accessory: {
            type: 11,
            media: {
              url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=120"
            }
          }
        },
        {
          type: 14,
          divider: true,
          spacing: 1
        },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: "Odbierz Bonus",
              custom_id: "ktk:act:none:none:b_claim",
              emoji: { name: "🎁" }
            },
            {
              type: 2,
              style: 2,
              label: "Zobacz Regulamin",
              custom_id: "ktk:act:none:none:b_rules",
              emoji: { name: "📜" }
            },
            {
              type: 2,
              style: 5,
              label: "Strona WWW",
              url: "https://kitek.pl",
              emoji: { name: "🌐" }
            }
          ]
        }
      ]
    }
  ]
};

console.log("JSON Payload valid length:", JSON.stringify(payload).length);
