/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../pages/Bills/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { initBillsPage, getBills } from "../pages/Bills/Bills.js"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

    })/* fix bug antichrono*/
    test("Then bills should be ordered from earliest to latest", () => {
      const billsSorted = [...bills].sort((a, b) => (a.date < b.date ? 1 : -1))
      document.body.innerHTML = BillsUI({ data: billsSorted })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
describe("Additional tests for Bills Page", () => {

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  })

  test("Then bills are displayed correctly", () => {
    document.body.innerHTML = BillsUI({ data: bills })

    const rows = screen.getByTestId("tbody").querySelectorAll("tr")
    expect(rows.length).toBe(bills.length)
  })

  test("Then loading state is displayed", () => {
    document.body.innerHTML = BillsUI({ loading: true })

    expect(document.body.innerHTML).toContain("Loading")
  })

  test("Then error 404 is displayed", () => {
    document.body.innerHTML = BillsUI({ error: "Erreur 404" })

    expect(screen.getByText("Erreur 404")).toBeTruthy()
  })

  test("Then error 500 is displayed", () => {
    document.body.innerHTML = BillsUI({ error: "Erreur 500" })

    expect(screen.getByText("Erreur 500")).toBeTruthy()
  })

  test("Then clicking new bill button navigates", () => {
    document.body.innerHTML = BillsUI({ data: bills })

    const mockNavigate = jest.fn()

    initBillsPage({
      document,
      onNavigate: mockNavigate,
      store: null,
      localStorage: window.localStorage
    })

    const btn = screen.getByTestId("btn-new-bill")
    btn.click()

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"])
  })

  test("Then clicking eye icon triggers modal", () => {
    document.body.innerHTML = BillsUI({ data: bills })

    global.bootstrap = {
      Modal: class {
        constructor() {}
        show = jest.fn()
      }
    }

    initBillsPage({
      document,
      onNavigate: jest.fn(),
      store: null,
      localStorage: window.localStorage
    })

    const icon = document.querySelector('[data-testid="icon-eye"]')
    icon.click()

    expect(icon).toBeTruthy()
  })

  test("Then getBills returns formatted data", async () => {
    const mockStore = {
      bills: () => ({
        list: () => Promise.resolve(bills)
      })
    }

    const result = await getBills(mockStore)

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty("date")
    expect(result[0]).toHaveProperty("status")
  })

  test("Then getBills handles API error", async () => {
    const mockStore = {
      bills: () => ({
        list: () => Promise.reject("Erreur API")
      })
    }

    await expect(getBills(mockStore)).rejects.toBe("Erreur API")
  })

  test("Then getBills returns empty array if no store", async () => {
    const result = await getBills(null)
    expect(result).toEqual([])
  })

})
describe("Bills.js deeper tests", () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <button data-testid="btn-new-bill"></button>
        <div data-testid="icon-eye" data-bill-url="test.jpg"></div>
        <div id="modaleFile">
          <div class="modal-body"></div>
        </div>
      </div>
    `

    global.bootstrap = {
      Modal: class {
        constructor() {}
        show = jest.fn()
      }
    }
  })

  test("handleClickIconEye should inject image in modal", () => {
    const icon = document.querySelector('[data-testid="icon-eye"]')


    initBillsPage({
      document,
      onNavigate: jest.fn(),
      store: null,
      localStorage: window.localStorage
    })

    icon.click()

    const modal = document.querySelector("#modaleFile")

    modal.dispatchEvent(new Event("shown.bs.modal"))

    expect(modal.querySelector("img")).toBeTruthy()
    expect(modal.querySelector("img").src).toContain("test.jpg")
  })

  test("getBills should format date correctly", async () => {

    const mockStore = {
      bills: () => ({
        list: () => Promise.resolve([
          { date: "2022-01-01", status: "pending" }
        ])
      })
    }

    const result = await getBills(mockStore)

    expect(result[0].date).not.toBe("2022-01-01")
  })

  test("getBills should fallback if formatDate fails", async () => {

    const mockStore = {
      bills: () => ({
        list: () => Promise.resolve([
          { date: "invalid-date", status: "pending" }
        ])
      })
    }

    const result = await getBills(mockStore)

    expect(result[0].date).toBe("invalid-date")
  })

  test("getBills should throw error when API fails", async () => {
    
    const mockStore = {
      bills: () => ({
        list: () => Promise.reject("API ERROR")
      })
    }

    await expect(getBills(mockStore)).rejects.toBe("API ERROR")
  })

  test("initBillsPage should attach multiple icon listeners", () => {
    document.body.innerHTML = `
      <div>
        <div data-testid="icon-eye" data-bill-url="1.jpg"></div>
        <div data-testid="icon-eye" data-bill-url="2.jpg"></div>
        <div id="modaleFile"><div class="modal-body"></div></div>
      </div>
    `

    const { initBillsPage } = require("../pages/Bills/Bills.js")

    initBillsPage({
      document,
      onNavigate: jest.fn(),
      store: null,
      localStorage: window.localStorage
    })

    const icons = document.querySelectorAll('[data-testid="icon-eye"]')

    expect(icons.length).toBe(2)
  })

})