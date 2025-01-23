export default {
  // LICENSE CONFIGURATION --> PLEASE INPUT YOUR LICENSE KEY HERE
    license: {
      key: 'KEYAUTH-nHtglR-jR5crV-Rll4zQ-3fKrhR-dcEAjn-jHUEU9' //KEYAUTH-nHtglR-jR5crV-Rll4zQ-3fKrhR-dcEAjn-jHUEU9
    },


  // BOT CONFIGURATION --> PLEASE INPUT YOUR BOT TOKEN HERE
  token: 'MTMyNTY3OTUyMzYwMTA1OTg3MA.GQWLUM.PG87NAroPunGvA-SY-MUTpuh8gYdl86yUzuVr4',
  
  // DATABASE CONFIGURATION
  supabase: {
    url: 'https://bydyjarolvxwfsvvyczq.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZHlqYXJvbHZ4d2ZzdnZ5Y3pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjE5OTE3MCwiZXhwIjoyMDUxNzc1MTcwfQ.unPpwkGRafGjXk4t-lv7bo86ua8DN1dbKEAb-9G5uz4'
  },
  
  // TWILIO INFORMATION (/call command)
// Twilio Configuration
twilio: {
  enabled: true,
  accountSid: 'AC5b77e2dcdb7e60002013fbac78c3511b',
  authToken: '5732647f09bd41e26c67b65f49ae449b',
  fromNumber: '+18889204572',
  numbers: {
    anthony: '+12672393397',
    jamie: '+14782201734'
  },
  display: {
    anthony: 'Anthony',
    jamie: 'Jamie'  
  },
  bothOption: true,
  twimlBinUrl: 'https://handler.twilio.com/twiml/EHe7e0f8b8f0511ee9c1402f947f38505',
  callTimeout: 30000,
  cooldown: 120000
},
  // MISCELLANEOUS DISCORD INFORMATION
  roles: {
    staff: '1321241224220512388'
  },
  
  channels: {
    priority: '1325682411748458496'
  },
  
  // TICKET CATEGORIES 
  categories: {
    'pre-sales': {
      id: '1325955900510441522',
      label: 'Pre-Sales Questions',
      description: 'Questions about our products before purchase'
    },
    'general': {
      id: '1325681149036597289',
      label: 'General Support',
      description: 'General support for all services'
    },
    'minecraft': {
      id: '1325682539968593951',
      label: 'Minecraft Support',
      description: 'Support for Minecraft related services'
    },
    'dedicated': {
      id: '1325682463464493086',
      label: 'Dedicated Inquiry',
      description: 'Inquiries about dedicated servers'
    }
  },

// EMBED CONFIGURATIONS
embeds: {
  panel: {
    title: '🎫 Support Ticket System',
    description: 'Welcome to our Support System!\nTo create a ticket, select a category below that best matches your inquiry.',
    color: '#2f3136',
    footer: {
      text: 'Powered by StackBlitz Hosting',
      iconURL: 'https://i.imgur.com/AfFp7pu.png'
    },
    timestamp: true
  },
  ticket: {
    welcome: {
      title: '🎫 Ticket Created',
      description: 'Thank you for creating a ticket! Our support team will assist you shortly.\n\nTo help us serve you better, please describe your issue in detail.',
      color: '#00ff00',
      fields: [
        {
          name: '⚡ Response Time',
          value: 'We typically respond within 24 hours',
          inline: true
        },
        {
          name: '📞 Emergency',
          value: 'Staff can use `/call` for urgent matters',
          inline: true
        }
      ],
      footer: {
        text: 'Please be patient while we review your ticket',
        iconURL: 'https://i.imgur.com/AfFp7pu.png'
      },
      timestamp: true
    }
  }
}
};