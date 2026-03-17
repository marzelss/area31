import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"

const db = getDatabase()

const container = document.getElementById("container")
const reportsList = document.getElementById("reportsList")
const emptyState = document.getElementById("emptyState")
const title = document.getElementById("title")
const backButton = document.getElementById("backButton")

async function init() {

    title.textContent = strings.historyTitle || "Report History"

    const reportsRef = ref(db, `${passcode}/reports`)
    const snapshot = await get(reportsRef)

    if (!snapshot.exists()) {
        emptyState.textContent = strings.noReports || "No reports yet."
        return
    }

    const reports = snapshot.val()
    const lang = strings.lang || "en"

    Object.values(reports).forEach(report => {

        const item = document.createElement("div")
        item.className = "reportItem"

        const name = document.createElement("div")
        name.className = "name"
        name.textContent = report.name

        const role = document.createElement("div")
        role.className = "role"
        role.textContent = report.role[lang] || report.role.en

        item.appendChild(name)
        item.appendChild(role)

        reportsList.appendChild(item)
    })

    backButton.textContent = strings.back || "← Back"
    backButton.onclick = () => {
        window.history.back()
    }

}

init()
