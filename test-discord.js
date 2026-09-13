const payload = {
  flags: 32768,
  components: [
    {
      type: 17,
      accent_color: 0x10b981,
      components: [
        {
          type: 9,
          components: [
            { type: 10, content: ' ' }
          ],
          accessory: {
            type: 11,
            media: { url: 'https://example.com/img.png', description: 'desc' } // Wrong!
          }
        }
      ]
    }
  ]
};
console.log(JSON.stringify(payload, null, 2));
