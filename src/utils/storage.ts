// Utility functions to interact with localStorage

interface CounterData {
  titles: Array<{
    id: string;
    title: string;
  }>;
}

// Default storage state
const DEFAULT_STORAGE: CounterData = {
  titles: []
};

// Initializes the storage if it doesn't exist
function initializeStorage() {
  if (!localStorage.getItem('counterData')) {
    localStorage.setItem('counterData', JSON.stringify({ titles: [] }));
  }
}

// Retrieves the titles from storage
function getTitles(): CounterData['titles'] {
  initializeStorage();
  const data = JSON.parse(localStorage.getItem('counterData') || JSON.stringify(DEFAULT_STORAGE)) as CounterData;
  return data.titles;
}

// Adds a new title to storage
function addTitle(title: { id: string; title: string }) {
  const data = JSON.parse(localStorage.getItem('counterData') || JSON.stringify(DEFAULT_STORAGE)) as CounterData;
  data.titles.push(title);
  localStorage.setItem('counterData', JSON.stringify(data));
}

// Removes a title from storage
function removeTitle(id: string) {
  const data = JSON.parse(localStorage.getItem('counterData') || JSON.stringify(DEFAULT_STORAGE)) as CounterData;
  data.titles = data.titles.filter(title => title.id !== id);
  localStorage.setItem('counterData', JSON.stringify(data));
}

export { initializeStorage, getTitles, addTitle, removeTitle };
