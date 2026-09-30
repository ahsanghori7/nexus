import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GreenButton, { CloseButton, TextButton } from "./Buttons";

describe("GreenButton Component", () => {
  test("renders with default props", () => {
    render(<GreenButton />);
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.getByText(/add/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  test("renders with custom label and disables button", () => {
    render(<GreenButton label="Submit" disabled />);
    expect(screen.getByText(/submit/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("triggers click event", () => {
    const handleClick = jest.fn();
    render(<GreenButton handleClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });

  test("shows loading spinner when loading is true", () => {
    render(<GreenButton loading />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});

describe("CloseButton Component", () => {
  test("renders with default text", () => {
    render(<CloseButton />);
    expect(screen.getByText(/no, go back/i)).toBeInTheDocument();
  });

  test("calls setShow on click", () => {
    const setShow = jest.fn();
    render(<CloseButton setShow={setShow} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setShow).toHaveBeenCalledWith(false);
  });
});

describe("TextButton Component", () => {
  test("renders with default children", () => {
    render(<TextButton />);
    expect(screen.getByText(/text of the button here/i)).toBeInTheDocument();
  });

  test("renders with custom text", () => {
    render(<TextButton text="Custom Text" />);
    expect(screen.getByText(/custom text/i)).toBeInTheDocument();
  });

  test("triggers handleClick on click", () => {
    const handleClick = jest.fn();
    render(<TextButton handleClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });
});
