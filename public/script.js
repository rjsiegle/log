// Fetch CSV URL dynamically
async function fetchCsvUrl() {
    try {
        const response = await fetch('/csv'); // Assuming the CSV route is '/csv'
        const csvUrl = await response.text();
        return csvUrl;
    } catch (error) {
        console.error('Error fetching CSV URL:', error);
        return null;
    }
}

// Update anchor tag with dynamic CSV URL
async function updateCsvLink() {
    const csvLink = document.getElementById('csvLink');
    const csvUrl = await fetchCsvUrl();
    if (csvUrl) {
        csvLink.href = csvUrl;
    } else {
        console.error('Failed to fetch CSV URL.');
    }
}

// Call the updateCsvLink function when the page loads
window.onload = () => {
    updateCsvLink();
};
