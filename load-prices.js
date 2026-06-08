// Load rate_card.json and convert to RATE_CARD format for use across all pages
let RATE_CARD = null;

async function loadRateCard() {
    try {
        const response = await fetch('rate_card.json');
        if (!response.ok) {
            throw new Error(`Failed to load rate_card.json: ${response.status}`);
        }
        const data = await response.json();
        
        // Convert JSON format to RATE_CARD format (expected by existing code)
        RATE_CARD = {};
        Object.entries(data).forEach(([key, category]) => {
            RATE_CARD[category.name] = {
                tax_rate: category.taxRate,
                services: {}
            };
            
            Object.entries(category.services).forEach(([serviceId, service]) => {
                RATE_CARD[category.name].services[service.name] = service.price;
            });
        });
        
        console.log('✅ RATE_CARD loaded from rate_card.json');
        return RATE_CARD;
    } catch (error) {
        console.error('❌ Error loading rate_card.json:', error);
        return null;
    }
}

// Load immediately when script is included
loadRateCard().then(() => {
    // Trigger custom event so pages know RATE_CARD is ready
    document.dispatchEvent(new CustomEvent('rateCardLoaded', { detail: RATE_CARD }));
});
