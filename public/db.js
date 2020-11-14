const indexedDB = window.indexedDB;
let db;
// create a new db request for a "budget" database
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {
  // create object store called 'pending' with autoincrementing
  const db = event.target.result;
  db.createObjectStore('pending', { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  // check if app in online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log('Err' + event.target.errorCode);
};

function saveRecord(record) {
  // transaction with readwrite access
  const transaction = db.transaction(['pending'], 'readwrite');
  // access to pending object store
  const store = transaction.objectStore('pending');
  // add record to store
  store.add(record);
}

function checkDatabase() {
  // open a transaction on pending db
  const transaction = db.transaction(['pending'], 'readwrite');
  const store = transaction.objectStore('pending');
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, delete record
          const transaction = db.transaction(['pending'], 'readwrite');
          const store = transaction.objectStore('pending');
          // clear all items in your store
          store.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
