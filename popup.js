document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('urlInput');
  const saveButton = document.getElementById('saveButton');
  const exportButton = document.getElementById('exportButton');
  const importButton = document.getElementById('importButton');
  const importInput = document.getElementById('importInput');

  loadSavedCompanies();

  saveButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (isValidLinkedInUrl(url)) {
      await saveCompany(url);
      urlInput.value = '';
    } else {
      alert('Please enter a valid LinkedIn company URL');
    }
  });

  exportButton.addEventListener('click', exportToCsv);
  
  importButton.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', handleImport);
});

function isValidLinkedInUrl(url) {
  return url.includes('linkedin.com/company/');
}

async function getCompanyInfo(url) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const descElement = document.querySelector('.org-top-card-summary__tagline');
        const logoElement = document.querySelector('.org-top-card-primary-content__logo-container img');
        
        return {
          description: descElement ? descElement.textContent.trim() : '',
          logo: logoElement ? logoElement.src : ''
        };
      }
    });

    return result[0].result;
  } catch (error) {
    console.error('Error fetching company info:', error);
    return {
      description: 'Description not available - Please visit the company page first',
      logo: ''
    };
  }
}

async function saveCompany(url) {
  try {
    const companySlug = url.match(/company\/(.*?)(\/|$)/)[1];
    const companyName = companySlug.replace(/-/g, ' ')
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('.');

    // Get company info including logo
    const { description, logo } = await getCompanyInfo(url);

    const company = {
      name: companyName,
      url: url,
      // Use LinkedIn logo if available, fallback to clearbit
      logo: logo || `https://logo.clearbit.com/${companySlug.split('.')[0]}.io`,
      date: new Date().toISOString(),
      description: description
    };

    const { savedCompanies = [] } = await chrome.storage.local.get('savedCompanies');
    
    // Check for duplicates
    if (savedCompanies.some(existing => existing.url === url)) {
      alert('This company is already saved!');
      return;
    }

    savedCompanies.unshift(company);
    await chrome.storage.local.set({ savedCompanies });
    loadSavedCompanies();
  } catch (error) {
    console.error('Error saving company:', error);
    alert('Error saving company. Please try again.');
  }
}

async function loadSavedCompanies() {
  const { savedCompanies = [] } = await chrome.storage.local.get('savedCompanies');
  const postsContainer = document.getElementById('postsContainer');
  
  if (savedCompanies.length === 0) {
    postsContainer.innerHTML = '<div class="empty-state">No companies saved yet</div>';
    return;
  }

  postsContainer.innerHTML = savedCompanies.map(company => `
    <div class="company-card">
      <div class="company-header">
        <img src="${company.logo}" alt="${company.name}" class="company-logo" data-default-src="icons/icon48.png">
        <div class="company-info">
          <div class="company-name">${company.name}</div>
        </div>
        <button class="delete-btn material-icons" data-url="${company.url}">delete</button>
      </div>
      <p class="company-description">${company.description}</p>
      <div class="company-footer">
        <div class="date">
          <span class="material-icons" style="font-size: 14px;">calendar_today</span>
          ${new Date(company.date).toLocaleDateString()}
        </div>
        <a href="${company.url}" target="_blank" class="visit-link">
          <span class="material-icons">open_in_new</span>
          Visit
        </a>
      </div>
    </div>
  `).join('');

  // Add error handlers for images
  document.querySelectorAll('.company-logo').forEach(img => {
    img.addEventListener('error', function() {
      this.src = this.dataset.defaultSrc;
    });
  });

  // Add delete handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to remove this company?')) {
        const urlToDelete = btn.dataset.url;
        const { savedCompanies = [] } = await chrome.storage.local.get('savedCompanies');
        const updatedCompanies = savedCompanies.filter(company => company.url !== urlToDelete);
        await chrome.storage.local.set({ savedCompanies: updatedCompanies });
        loadSavedCompanies();
      }
    });
  });
}

async function exportToCsv() {
  const { savedCompanies = [] } = await chrome.storage.local.get('savedCompanies');
  
  if (savedCompanies.length === 0) {
    alert('No companies to export');
    return;
  }

  const headers = ['Company Name', 'Date Added', 'LinkedIn URL', 'Description'];
  const rows = savedCompanies.map(company => [
    company.name,
    new Date(company.date).toLocaleDateString(),
    company.url,
    company.description
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `linkedin-companies-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = text.split('\n').map(row => {
      return row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        ?.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
    });

    // Remove header row
    rows.shift();

    const companies = rows
      .filter(row => row.length >= 4) // Ensure row has all required fields
      .map(row => {
        // Extract company slug from LinkedIn URL to construct logo URL
        const url = row[2]; // LinkedIn URL is in the third column
        const companySlug = url.match(/company\/(.*?)(\/|$)/)[1];
        
        return {
          name: row[0],
          date: new Date(row[1]).toISOString(),
          url: url,
          description: row[3],
          logo: `https://logo.clearbit.com/${companySlug.split('.')[0]}.io`
        };
      });

    if (companies.length === 0) {
      alert('No valid companies found in the import file');
      return;
    }

    const { savedCompanies = [] } = await chrome.storage.local.get('savedCompanies');
    
    // Merge existing and imported companies, avoiding duplicates
    const mergedCompanies = [...savedCompanies];
    let added = 0;
    
    for (const company of companies) {
      if (!savedCompanies.some(existing => existing.url === company.url)) {
        mergedCompanies.push(company);
        added++;
      }
    }

    await chrome.storage.local.set({ savedCompanies: mergedCompanies });
    loadSavedCompanies();
    
    alert(`Successfully imported ${added} new companies`);
  } catch (error) {
    console.error('Error importing companies:', error);
    alert('Error importing companies. Please check the file format.');
  }
  
  // Reset the input
  event.target.value = '';
} 