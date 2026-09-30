import argparse
import os

import pytest

# Define the base test directory
TEST_DIR = os.path.dirname(os.path.abspath(__file__))


def run_tests(service=None, test_file=None, test=None):
    """Finds and runs Playwright API tests based on specified service or test file."""

    # Build the test path based on provided arguments
    test_path = os.path.join(TEST_DIR, "services")
    if service:
        test_path = os.path.join(TEST_DIR, "services", service)
        if test_file:
            test_path = os.path.join(test_path, test_file) + "_test.py"

    if test:
        test_path = test_path + "::" + test

    print(f"🔥 Running Playwright API tests from: {test_path}")

    # Run pytest
    exit_code = pytest.main([test_path, "--disable-warnings"])

    if exit_code == 0:
        print("✅ All tests passed successfully!")
    else:
        print("❌ Some tests failed. Check the output for details.")


def main():
    """Parse command-line arguments and execute tests."""
    parser = argparse.ArgumentParser(description="Run Playwright API tests.")
    parser.add_argument("--service", help="Specify the service to test (e.g., account, user, trade).")
    parser.add_argument(
        "--file", help="Specify a single test file within the service directory (e.g., test_account_api.py)."
    )
    parser.add_argument("--test", help="Specify a single test (e.g., test_get_base).")

    args = parser.parse_args()
    run_tests(args.service, args.file, args.test)


if __name__ == "__main__":
    main()
