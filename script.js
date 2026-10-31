/**
 * script.js — Onboarding Buddy To Do List
 * Fitur: CRUD task, toggle completed/active, filter (All/Active/Completed),
 *        localStorage persistence, statistik dinamis.
 *
 * Struktur data satu task:
 * {
 *   id        : string   — UUID unik
 *   text      : string   — teks task
 *   completed : boolean  — status selesai/belum
 *   createdAt : number   — timestamp (Date.now())
 * }
 */

/* ============================================================
   1. STATE & KONSTANTA
   ============================================================ */

/** Key localStorage untuk menyimpan daftar task */
const STORAGE_KEY = "buddy_tasks";

/** Filter aktif saat ini: "all" | "active" | "completed" */
let currentFilter = "all";

/** Array utama yang menyimpan semua task */
let tasks = loadTasksFromStorage();

/** ID task yang sedang diedit (null jika tidak ada) */
let editingId = null;


/* ============================================================
   2. ELEMEN DOM
   ============================================================ */

const taskForm         = document.getElementById("task-form");
const taskInput        = document.getElementById("task-input");
const formError        = document.getElementById("form-error");
const taskList         = document.getElementById("task-list");
const emptyState       = document.getElementById("empty-state");
const emptySub         = document.getElementById("empty-sub");
const listFooter       = document.getElementById("list-footer");
const footerCount      = document.getElementById("footer-count");
const clearCompletedBtn= document.getElementById("clear-completed-btn");
const filterButtons    = document.querySelectorAll(".filter-btn");

// Stats
const statTotal        = document.getElementById("stat-total");
const statActive       = document.getElementById("stat-active");
const statCompleted    = document.getElementById("stat-completed");

// Modal
const editModal        = document.getElementById("edit-modal");
const editInput        = document.getElementById("edit-input");
const editError        = document.getElementById("edit-error");
const modalBackdrop    = document.getElementById("modal-backdrop");
const modalCancel      = document.getElementById("modal-cancel");
const modalSave        = document.getElementById("modal-save");


/* ============================================================
   3. LOCALSTORAGE — PERSISTENSI DATA
   ============================================================ */

/** Memuat task dari localStorage; kembalikan array kosong jika belum ada */
function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Menyimpan array tasks ke localStorage */
function saveTasksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}


/* ============================================================
   4. UTILITAS
   ============================================================ */

/**
 * Menghasilkan ID unik sederhana berbasis waktu + random.
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Sanitasi teks agar aman ditampilkan sebagai innerHTML
 * (mencegah XSS sederhana).
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Memfilter tasks berdasarkan currentFilter.
 * @returns {Task[]}
 */
function getFilteredTasks() {
  if (currentFilter === "active")    return tasks.filter(t => !t.completed);
  if (currentFilter === "completed") return tasks.filter(t =>  t.completed);
  return tasks; // "all"
}


/* ============================================================
   5. RENDER
   ============================================================ */

/** Merender ulang seluruh daftar task dan statistik */
function render() {
  const filtered = getFilteredTasks();

  // --- Statistik ---
  const totalCount     = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount    = totalCount - completedCount;

  statTotal.textContent     = totalCount;
  statActive.textContent    = activeCount;
  statCompleted.textContent = completedCount;

  // --- Footer ---
  if (totalCount > 0) {
    listFooter.classList.remove("hidden");
    listFooter.classList.add("flex");
    footerCount.textContent = `${activeCount} task tersisa`;
  } else {
    listFooter.classList.add("hidden");
    listFooter.classList.remove("flex");
  }

  // --- Daftar task ---
  taskList.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");
    // Ubah pesan sesuai filter aktif
    emptySub.textContent =
      currentFilter === "active"    ? "Tidak ada task yang aktif." :
      currentFilter === "completed" ? "Belum ada task yang selesai." :
                                      "Tambahkan task pertama Anda di atas.";
  } else {
    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");

    filtered.forEach(task => {
      const li = createTaskElement(task);
      taskList.appendChild(li);
    });
  }
}

/**
 * Membuat elemen <li> untuk satu task.
 * @param {{ id: string, text: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item task-enter";
  li.dataset.id = task.id;
  li.setAttribute("role", "listitem");

  li.innerHTML = `
    <input
      type="checkbox"
      class="task-checkbox"
      aria-label="Tandai task selesai"
      ${task.completed ? "checked" : ""}
    />
    <span class="task-text ${task.completed ? "completed" : ""}">${escapeHtml(task.text)}</span>
    <div class="task-actions" aria-label="Aksi task">
      <button class="btn-icon btn-edit" aria-label="Edit task" title="Edit">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
               m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>
      <button class="btn-icon btn-delete" aria-label="Hapus task" title="Hapus">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
               m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `;

  // Event: toggle completed via checkbox
  const checkbox = li.querySelector(".task-checkbox");
  checkbox.addEventListener("change", () => toggleTask(task.id));

  // Event: edit
  li.querySelector(".btn-edit").addEventListener("click", () => openEditModal(task.id));

  // Event: delete
  li.querySelector(".btn-delete").addEventListener("click", () => deleteTask(task.id));

  return li;
}


/* ============================================================
   6. CRUD OPERATIONS
   ============================================================ */

/**
 * Menambahkan task baru.
 * @param {string} text — teks task yang sudah di-trim
 */
function addTask(text) {
  const newTask = {
    id       : generateId(),
    text     : text,
    completed: false,
    createdAt: Date.now(),
  };
  tasks.push(newTask);
  saveTasksToStorage();
  render();
}

/**
 * Toggle status completed sebuah task.
 * @param {string} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasksToStorage();
  render();
}

/**
 * Memperbarui teks sebuah task.
 * @param {string} id
 * @param {string} newText
 */
function updateTask(id, newText) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.text = newText;
  saveTasksToStorage();
  render();
}

/**
 * Menghapus satu task berdasarkan ID.
 * @param {string} id
 */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasksToStorage();
  render();
}

/** Menghapus semua task yang berstatus completed */
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasksToStorage();
  render();
}


/* ============================================================
   7. MODAL EDIT
   ============================================================ */

/**
 * Membuka modal edit dan mengisi nilai input dengan teks task.
 * @param {string} id
 */
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingId = id;
  editInput.value = task.text;
  editError.classList.add("hidden");

  editModal.classList.remove("hidden");
  editModal.classList.add("flex");

  // Fokus input setelah animasi selesai
  setTimeout(() => editInput.focus(), 50);
}

/** Menutup modal edit */
function closeEditModal() {
  editModal.classList.add("hidden");
  editModal.classList.remove("flex");
  editingId = null;
  editInput.value = "";
  editError.classList.add("hidden");
}

/** Menyimpan perubahan dari modal edit */
function saveEdit() {
  const newText = editInput.value.trim();
  if (!newText) {
    editError.classList.remove("hidden");
    editInput.focus();
    return;
  }
  updateTask(editingId, newText);
  closeEditModal();
}


/* ============================================================
   8. EVENT LISTENERS
   ============================================================ */

// --- Form tambah task ---
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    formError.classList.remove("hidden");
    taskInput.focus();
    return;
  }
  formError.classList.add("hidden");
  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

// Hilangkan error saat user mulai mengetik
taskInput.addEventListener("input", () => {
  if (taskInput.value.trim()) formError.classList.add("hidden");
});

// --- Filter tabs ---
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Update state filter
    currentFilter = btn.dataset.filter;

    // Perbarui tampilan tab aktif
    filterButtons.forEach(b => {
      b.classList.remove("active-filter");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active-filter");
    btn.setAttribute("aria-selected", "true");

    render();
  });
});

// --- Clear Completed ---
clearCompletedBtn.addEventListener("click", clearCompleted);

// --- Modal: tombol Batal ---
modalCancel.addEventListener("click", closeEditModal);

// --- Modal: tombol Simpan ---
modalSave.addEventListener("click", saveEdit);

// --- Modal: klik backdrop untuk menutup ---
modalBackdrop.addEventListener("click", closeEditModal);

// --- Modal: tekan Escape untuk menutup ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editingId !== null) closeEditModal();
});

// --- Modal: tekan Enter di input edit untuk menyimpan ---
editInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveEdit();
});

// Hilangkan error edit saat user mengetik
editInput.addEventListener("input", () => {
  if (editInput.value.trim()) editError.classList.add("hidden");
});


/* ============================================================
   9. INISIALISASI
   ============================================================ */

// Render pertama kali saat halaman dimuat
render();
