"use strict";

const dbName = "arxfinote";
const dbVersion = 1;
const storeName = "transactions";
let dbCache = null;

const nanoid = (size = 21) => {
    const alphabet =
        "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
    let id = "",
        random = crypto.getRandomValues(new Uint8Array(size));
    for (let i = 0; i < size; i++) {
        id += alphabet[63 & random[i]];
    }
    return id;
};

const formatCurrency = (num) => {
    return new Intl.NumberFormat("id-ID", {
        currency: "IDR",
        minimumFractionDigits: 0,
        style: "currency",
    }).format(num);
};
const parseCurrency = (num) => {
    return parseFloat(num.replace(/[^0-9,-]+/g, "").replace(",", "."));
};

document.addEventListener("DOMContentLoaded", () => {
    dayjs.locale("id");
    AOS.init({
        duration: 800,
        easing: "ease-in-out-quart",
        once: true,
    });
});

document.addEventListener("alpine:init", () => {
    Alpine.data("finoteApp", () => ({
        async init() {
            try {
                await this.loadTransactions();
            } catch (e) {
                this.toastMessage = "Data transaksi gagal dimuat.";
                bootstrap.Toast.getOrCreateInstance("#toast").show();
            }
        },
        transactions: [],
        searchQuery: "",
        filterCategory: "",
        filterMonth: "",
        editing: false,
        activeID: null,
        form: {
            id: null,
            description: "",
            nominal: "",
            date: dayjs().format("YYYY-MM-DD"),
            category: "expense",
        },
        scrollToTop: false,
        toastMessage: "",
        async openDB() {
            if (dbCache) return dbCache;
            dbCache = await idb.openDB(dbName, dbVersion, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, {
                            keyPath: "id",
                        });
                    }
                },
            });
            return dbCache;
        },
        async loadTransactions() {
            const db = await this.openDB();
            const store = db
                .transaction(storeName, "readonly")
                .objectStore(storeName);

            const transactions = await store.getAll();

            this.transactions = transactions.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );
        },
        async saveTransaction() {
            try {
                const transactionData = {
                    id: this.editing ? this.form.id : nanoid(),
                    description: this.form.description.trim(),
                    nominal: parseCurrency(this.form.nominal),
                    date: this.form.date,
                    category: this.form.category,
                };

                const db = await this.openDB();
                const store = db
                    .transaction(storeName, "readwrite")
                    .objectStore(storeName);

                if (this.editing) {
                    await store.put(transactionData);
                } else {
                    await store.add(transactionData);
                }
                await this.loadTransactions();
                bootstrap.Modal.getOrCreateInstance("#saveModal").hide();
                this.toastMessage = "Data transaksi berhasil disimpan.";
            } catch (e) {
                this.toastMessage = "Data transaksi gagal disimpan.";
            } finally {
                bootstrap.Toast.getOrCreateInstance("#toast").show();
            }
        },
        editTransaction(transaction) {
            this.editing = true;
            this.form = {
                id: transaction.id,
                description: transaction.description,
                nominal: formatCurrency(transaction.nominal)
                    .replace("Rp", "")
                    .trim(),
                date: transaction.date,
                category: transaction.category,
            };
        },
        async deleteTransaction(id) {
            try {
                const db = await this.openDB();
                const store = db
                    .transaction(storeName, "readwrite")
                    .objectStore(storeName);
                await store.delete(id);
                this.activeID = null;
                await this.loadTransactions();
                bootstrap.Modal.getOrCreateInstance("#deleteModal").hide();
                this.toastMessage = "Data transaksi berhasil dihapus.";
            } catch (e) {
                this.toastMessage = "Data transaksi gagal dihapus.";
            } finally {
                bootstrap.Toast.getOrCreateInstance("#toast").show();
            }
        },
        resetForm() {
            this.editing = false;
            this.form = {
                id: null,
                description: "",
                nominal: "",
                date: dayjs().format("YYYY-MM-DD"),
                category: "expense",
            };
        },
        get filteredTransactions() {
            return this.transactions.filter((transaction) => {
                const matchesSearch = transaction.description
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase());
                const matchesCategory = this.filterCategory
                    ? transaction.category === this.filterCategory
                    : true;
                const matchesMonth = this.filterMonth
                    ? transaction.date.startsWith(this.filterMonth)
                    : true;
                return matchesSearch && matchesCategory && matchesMonth;
            });
        },
        get totalIncome() {
            return this.transactions
                .filter((transaction) => transaction.category === "income")
                .reduce((a, b) => a + b.nominal, 0);
        },
        get totalExpense() {
            return this.transactions
                .filter((transaction) => transaction.category === "expense")
                .reduce((a, b) => a + b.nominal, 0);
        },
        get balance() {
            return this.totalIncome - this.totalExpense;
        },
        exportData() {
            const transactionData = JSON.stringify(this.transactions, null, 0);

            try {
                download(
                    transactionData,
                    `arxfinote_${Date.now()}.json`,
                    "application/json"
                );
                this.toastMessage = "Data transaksi berhasil diekspor.";
            } catch (e) {
                this.toastMessage = "Data transaksi gagal diekspor.";
            } finally {
                bootstrap.Toast.getOrCreateInstance("#toast").show();
            }
        },
        importData(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", async (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    const db = await this.openDB();
                    const store = db
                        .transaction(storeName, "readwrite")
                        .objectStore(storeName);
                    await store.clear();
                    for (const item of imported) {
                        await store.add(item);
                    }
                    await this.loadTransactions();
                    this.toastMessage = "Data transaksi berhasil diimpor.";
                } catch (err) {
                    this.toastMessage = "Data transaksi gagal diimpor.";
                } finally {
                    bootstrap.Toast.getOrCreateInstance("#toast").show();
                    e.target.value = "";
                }
            });
            reader.readAsText(file);
        },
    }));
});
