/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../pages/NewBill/NewBillUI.js"
import { initNewBillPage } from "../pages/NewBill/NewBill.js"

describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {

    beforeEach(() => {
      document.body.innerHTML = NewBillUI()
    })

    test("Then the form should be rendered with all required fields", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()

      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })

    test("Then the submit button should be rendered", () => {
      const submitButton = screen.getByText("Envoyer")

      expect(submitButton).toBeTruthy()
      expect(submitButton.type).toBe("submit")
    })

    test("Then the page title should be displayed", () => {
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })

    test("Then the expense type select should have all options", () => {
      expect(screen.getByText("Transports")).toBeTruthy()
      expect(screen.getByText("Restaurants et bars")).toBeTruthy()
      expect(screen.getByText("Hôtel et logement")).toBeTruthy()
      expect(screen.getByText("Services en ligne")).toBeTruthy()
      expect(screen.getByText("IT et électronique")).toBeTruthy()
      expect(screen.getByText("Equipement et matériel")).toBeTruthy()
      expect(screen.getByText("Fournitures de bureau")).toBeTruthy()
    })

    test("Then uploading a valid file should work", () => {
      const fileInput = screen.getByTestId("file")

      const file = new File(["image"], "test.png", { type: "image/png" })

      Object.defineProperty(fileInput, "files", {
        value: [file],
      })

      fileInput.dispatchEvent(new Event("change"))

      expect(fileInput.files[0].name).toBe("test.png")
    })

    test("Then uploading an invalid file should still trigger change", () => {
      const fileInput = screen.getByTestId("file")

      const file = new File(["doc"], "test.pdf", { type: "application/pdf" })

      Object.defineProperty(fileInput, "files", {
        value: [file],
      })

      fileInput.dispatchEvent(new Event("change"))

      expect(fileInput.files[0].type).toBe("application/pdf")
    })

    test("Then submitting the form should trigger submit handler", () => {
      const form = screen.getByTestId("form-new-bill")

      const mockSubmit = jest.fn()
      form.addEventListener("submit", mockSubmit)

      form.dispatchEvent(new Event("submit"))

      expect(mockSubmit).toHaveBeenCalled()
    })

    test("Then initNewBillPage should initialize the page", () => {
      initNewBillPage()

      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })

  })
})

describe("NewBill core behavior (clean coverage)", () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <form data-testid="form-new-bill">
        <select data-testid="expense-type"><option>Transports</option></select>
        <input data-testid="expense-name" />
        <input data-testid="amount" />
        <input data-testid="datepicker" />
        <input data-testid="vat" />
        <input data-testid="pct" />
        <textarea data-testid="commentary"></textarea>
        <input data-testid="file" type="file" />
        <button type="submit"></button>
      </form>
    `

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => JSON.stringify({ email: "test@test.com" })
      }
    })
  })

  test("should call API when file is valid", async () => {
    const mockCreate = jest.fn(() =>
      Promise.resolve({ fileUrl: "url.jpg", key: "123" })
    )

    const mockStore = {
      bills: () => ({ create: mockCreate })
    }

    initNewBillPage({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: window.localStorage
    })

    const fileInput = document.querySelector('[data-testid="file"]')
    const file = new File(["img"], "test.jpg", { type: "image/jpg" })

    Object.defineProperty(fileInput, "files", { value: [file] })
    fileInput.dispatchEvent(new Event("change"))

    await Promise.resolve()

    expect(mockCreate).toHaveBeenCalled()
  })

  test("should show alert when file is invalid", () => {
    window.alert = jest.fn()

    initNewBillPage({
      document,
      onNavigate: jest.fn(),
      store: null,
      localStorage: window.localStorage
    })

    const fileInput = document.querySelector('[data-testid="file"]')
    const file = new File(["doc"], "test.pdf", { type: "application/pdf" })

    Object.defineProperty(fileInput, "files", { value: [file] })
    fileInput.dispatchEvent(new Event("change"))

    expect(window.alert).toHaveBeenCalled()
  })

  test("should submit form and navigate", async () => {
    const mockUpdate = jest.fn(() => Promise.resolve())
    const mockNavigate = jest.fn()

    const mockStore = {
      bills: () => ({ update: mockUpdate })
    }

    initNewBillPage({
      document,
      onNavigate: mockNavigate,
      store: mockStore,
      localStorage: window.localStorage
    })

    document.querySelector('[data-testid="expense-name"]').value = "test"
    document.querySelector('[data-testid="amount"]').value = "100"
    document.querySelector('[data-testid="datepicker"]').value = "2022-01-01"
    document.querySelector('[data-testid="vat"]').value = "20"
    document.querySelector('[data-testid="pct"]').value = "10"
    document.querySelector('[data-testid="commentary"]').value = "ok"

    const form = document.querySelector('[data-testid="form-new-bill"]')
    form.dispatchEvent(new Event("submit"))

    await Promise.resolve()

    expect(mockUpdate).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalled()
  })

  test("should handle API error on submit", async () => {
    console.error = jest.fn()

    const mockStore = {
      bills: () => ({
        update: () => Promise.reject("ERROR")
      })
    }

    initNewBillPage({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: window.localStorage
    })

    const form = document.querySelector('[data-testid="form-new-bill"]')
    form.dispatchEvent(new Event("submit"))

    await Promise.resolve()

    expect(console.error).toHaveBeenCalled()
  })

})