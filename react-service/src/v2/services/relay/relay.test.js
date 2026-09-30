import Relay from "./index";
import * as sessionHelpers from 'v2/helpers/session';

jest.mock('v2/helpers/session', () => ({
  handleUnauthorized: jest.fn(),
  SESSION_EXPIRED_KEY: 'session_expired_message',
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  })
);

describe("Relay Class", () => {
  const mockHost = "https://api.example.com";
  const mockVersion = "v1";
  const mockResource = "users";

  let relay;

  beforeEach(() => {
    relay = new Relay(mockResource, mockVersion, mockHost);
    fetch.mockClear();
    sessionHelpers.handleUnauthorized.mockClear();
  });

  test("should construct the correct service URL", () => {
    expect(relay.buildServiceUrl()).toBe(`${mockHost}/${mockVersion}/${mockResource}`);
  });

  test("should return correct URL with method and params", () => {
    const url = relay.getUrl("list", { page: 1, limit: 10 });
    expect(url).toBe(`${mockHost}/${mockVersion}/${mockResource}/list?page=1&limit=10`);
  });

  test("should make a GET request", async () => {
    await relay.get("details", { id: 5 });
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/details?id=5`,
      { method: "GET" }
    );
  });

  test("should make a POST request", async () => {
    const payload = { name: "John Doe" };
    await relay.post(payload, "create");
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/create`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  test("should make a PATCH request", async () => {
    const payload = { name: "John Doe" };
    await relay.patch(payload, "update");
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/update`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  test("should make a DELETE request", async () => {
    await relay.deleter("remove", { id: 5 });
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/remove?id=5`,
      {
        method: "DELETE",
        body: JSON.stringify(undefined),
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  test("should handle an empty resource", () => {
    const emptyRelay = new Relay("");
    expect(emptyRelay.buildServiceUrl()).toBe(`${global.RELAY.HOST}/${global.RELAY.VERSION}/`);
  });

  test("should handle missing method in URL generation", () => {
    expect(relay.getUrl()).toBe(`${mockHost}/${mockVersion}/${mockResource}`);
  });

  test("should handle null parameters in GET request", async () => {
    await relay.get("details", null);
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/details`,
      { method: "GET" }
    );
  });

  test("should make a PUT request", async () => {
    const payload = { name: "John Doe" };
    await relay.put(payload, "modify");
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/modify`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  test("should make a POST form request", async () => {
    const payload = { name: "John Doe", email: "john@example.com" };
    await relay.postForm(payload, "submit");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("submit"), expect.objectContaining({ method: "POST" }));
  });

  test("should make a PATCH form request", async () => {
    const payload = { file: [new File(["content"], "test.txt", { type: "text/plain" })] };
    await relay.patchForm(payload, "upload");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("upload"), expect.objectContaining({ method: "PATCH" }));
  });

  test("should handle fetch failure", async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error("Network Error")));
    await expect(relay.get("failTest")).rejects.toThrow("Network Error");
  });

  describe("getJson method", () => {
    test("should make a GET request and parse JSON", async () => {
      const mockJsonResponse = { data: "test" };
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockJsonResponse),
      });
      // getJson(method, params) calls this.get(params)
      // so the first arg to getJson is ignored, and the second arg is used as 'method' for getUrl
      const result = await relay.getJson(null, "data");
      expect(fetch).toHaveBeenCalledWith(
        `${mockHost}/${mockVersion}/${mockResource}/data`,
        { method: "GET" }
      );
      expect(result).toEqual(mockJsonResponse);
    });

    test("should make a GET request with query params via getJson", async () => {
      // This test highlights that getJson cannot directly pass query params if its second arg is for path
      // To test getJson with query params, we'd need getJson(methodForPath, queryParamsForGet)
      // and getJson would call this.get(methodForPath, queryParamsForGet)
      // Current: getJson(ignored, pathSegment) -> this.get(pathSegment) -> this.getUrl(pathSegment, undefined)
      // If we want getJson to produce .../resource/path?query=1
      // then this.get("path", {query:1}) must be called.
      // getJson(anything, "path") would call this.get("path")
      // This means getJson as is cannot produce query params if a path is also given via its second argument.
      // Let's test getJson where its second argument (used as path) is undefined, and third (if it existed) for params.
      // Since getJson only has two args, let's test what happens if the second arg (path) is an object (meant as params).
      // relay.getJson(null, {id: 7})
      // -> this.get({id: 7})
      // -> this.getUrl({id: 7}, undefined)
      // -> URL: ".../users/[object Object]" - which is not useful.

      // Test getJson with no path segment, but with params (this won't work as expected by typical use)
      // relay.getJson(null, {id: 123})
      // -> this.get({id:123})
      // -> this.getUrl({id:123}, undefined) -> .../users/[object Object]
      // This shows a limitation or specific design of getJson.
      // For now, we'll test getJson with only a path segment, as fixed above.
      // A separate test for get(method, params) already covers query params.
      const mockJsonResponse = { data: "test" };
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockJsonResponse),
      });
      // Call getJson with its 'params' argument being undefined, so get() is called with method=undefined
      const result = await relay.getJson(); // equivalent to relay.getJson(undefined, undefined)
      expect(fetch).toHaveBeenCalledWith(
        `${mockHost}/${mockVersion}/${mockResource}`, // No method, no params
        { method: "GET" }
      );
      expect(result).toEqual(mockJsonResponse);
    });
  });

  test("should trim email in postForm", async () => {
    const payload = { email: "  test@example.com  ", other: "value" };
    await relay.postForm(payload, "submitTrim");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("email")).toBe("test@example.com");
    expect(formData.get("other")).toBe("value");
  });

  test("should handle multiple files in postForm", async () => {
    const files = [
      new File(["content1"], "file1.txt", { type: "text/plain" }),
      new File(["content2"], "file2.txt", { type: "text/plain" }),
    ];
    const payload = { documents: files, name: "multi-file test" };
    await relay.postForm(payload, "submitMultiFile");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.getAll("documents[]").length).toBe(2);
    expect(formData.getAll("documents[]")[0].name).toBe("file1.txt");
    expect(formData.getAll("documents[]")[1].name).toBe("file2.txt");
    expect(formData.get("name")).toBe("multi-file test");
  });

  test("should handle single file object (not in array) in postForm", async () => {
    // Simulate data where a file might not be wrapped in an array if it's a single upload field
    // The code `Object.prototype.hasOwnProperty.call(value, 0)` checks for array-like
    // So, to test the 'else' for single file, `value[0]` should not exist.
    // However, the check `typeof value[0].name === 'string'` implies value[0] is expected.
    // The original code is:
    // if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 0) && typeof value[0].name === 'string')
    // This means `value` must be an array-like object with at least one element, and that element must have a name.
    // The 'else' part `formData.append(k, value);` is for non-file values or non-array-like file values.
    // The test "should handle single file correctly in postForm" already covers `value = value[0]`
    // Let's ensure the non-file path in postForm is also tested for a simple value.
    const payload = { name: "John Doe", age: 30 };
    await relay.postForm(payload, "submitSimpleData");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("name")).toBe("John Doe");
    expect(formData.get("age")).toBe("30");
  });

  test("should handle 0 or false values in postForm correctly", async () => {
    const payload = { count: 0, enabled: false, description: "test" };
    await relay.postForm(payload, "submitZeroFalse");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("count")).toBe(""); // 0 || '' results in ''
    expect(formData.get("enabled")).toBe(""); // false || '' results in ''
    expect(formData.get("description")).toBe("test");
  });

  test("should handle null or undefined values in postForm correctly", async () => {
    const payload = { supervisor: null, department: undefined, task: "review" };
    await relay.postForm(payload, "submitNullUndefined");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("supervisor")).toBe(""); // null || '' results in ''
    expect(formData.get("department")).toBe(""); // undefined || '' results in ''
    expect(formData.get("task")).toBe("review");
  });
  
  test("should handle single file correctly in postForm", async () => {
    const file = new File(["content1"], "file1.txt", { type: "text/plain" });
    const payload = { document: [file], description: "single file" }; // Note: file is in an array
    await relay.postForm(payload, "submitSingleFileInArray");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("document").name).toBe("file1.txt");
    expect(formData.get("description")).toBe("single file");
  });

  test("should handle multiple files in patchForm", async () => {
    const files = [
      new File(["content1"], "file1-patch.txt", { type: "text/plain" }),
      new File(["content2"], "file2-patch.txt", { type: "text/plain" }),
    ];
    const payload = { attachments: files, comment: "multi-file patch" };
    await relay.patchForm(payload, "uploadMultiFile");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.getAll("attachments[]").length).toBe(2);
    expect(formData.getAll("attachments[]")[0].name).toBe("file1-patch.txt");
    expect(formData.getAll("attachments[]")[1].name).toBe("file2-patch.txt");
    expect(formData.get("comment")).toBe("multi-file patch");
  });

  test("should handle single file correctly in patchForm", async () => {
    const file = new File(["patch-content"], "patch-file.txt", { type: "text/plain" });
    const payload = { attachment: [file], note: "single patch file" }; // Note: file is in an array
    await relay.patchForm(payload, "uploadSingleFileInArray");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("attachment").name).toBe("patch-file.txt");
    expect(formData.get("note")).toBe("single patch file");
  });

  test("should handle non-file data correctly in patchForm", async () => {
    const payload = { title: "Update Title", isActive: false, quantity: 0 };
    await relay.patchForm(payload, "updateSimpleData");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("title")).toBe("Update Title");
    expect(formData.get("isActive")).toBe(""); // false || '' is ''
    expect(formData.get("quantity")).toBe(""); // 0 || '' is ''
  });

  test("should handle null or undefined values in patchForm correctly", async () => {
    const payload = { manager: null, status: undefined, project: "alpha" };
    await relay.patchForm(payload, "updateNullUndefined");
    const formData = fetch.mock.calls[0][1].body;
    expect(formData.get("manager")).toBe(""); // null || '' results in ''
    expect(formData.get("status")).toBe(""); // undefined || '' results in ''
    expect(formData.get("project")).toBe("alpha");
  });
  
  test("should make a DELETE request with data", async () => {
    const deleteData = { reason: "cleanup" };
    await relay.deleter("removeWithData", { id: 10 }, deleteData);
    expect(fetch).toHaveBeenCalledWith(
      `${mockHost}/${mockVersion}/${mockResource}/removeWithData?id=10`,
      {
        method: "DELETE",
        body: JSON.stringify(deleteData),
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  // TODO: Enable this test when refactoring Relay to not always resolve successfully
  // test("should handle invalid HTTP method", async () => {
  //   await expect(relay.call("/invalid", "INVALID")).rejects.toThrow();
  // });

  describe("401 Unauthorized handling", () => {
    test("should call handleUnauthorized and return a never-resolving promise on 401", async () => {
      fetch.mockResolvedValueOnce({ status: 401, json: () => Promise.resolve({}) });

      let settled = false;
      relay.get("protected").then(() => { settled = true; }).catch(() => { settled = true; });

      // Flush the microtask queue so the fetch resolves and handleUnauthorized fires.
      await Promise.resolve();

      expect(sessionHelpers.handleUnauthorized).toHaveBeenCalledTimes(1);
      // The promise must not have settled — downstream components never see the 401 body.
      expect(settled).toBe(false);
    });

    test("should return a never-resolving promise for POST 401 responses", async () => {
      fetch.mockResolvedValueOnce({ status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) });

      let settled = false;
      relay.post({ data: "test" }, "create").then(() => { settled = true; }).catch(() => { settled = true; });

      await Promise.resolve();

      expect(sessionHelpers.handleUnauthorized).toHaveBeenCalledTimes(1);
      expect(settled).toBe(false);
    });

    test("should NOT call handleUnauthorized for non-401 responses", async () => {
      fetch.mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ success: true }) });

      await relay.get("public");

      expect(sessionHelpers.handleUnauthorized).not.toHaveBeenCalled();
    });

    test("should NOT call handleUnauthorized for 403 responses", async () => {
      fetch.mockResolvedValueOnce({ status: 403, json: () => Promise.resolve({ error: "Forbidden" }) });

      await relay.get("forbidden");

      expect(sessionHelpers.handleUnauthorized).not.toHaveBeenCalled();
    });
  });

  describe("buildServiceUrl with different inputs", () => {
    test("should handle host with trailing slash", () => {
      const r = new Relay(mockResource, mockVersion, `${mockHost}/`);
      expect(r.buildServiceUrl()).toBe(`${mockHost}/${mockVersion}/${mockResource}`);
    });

    test("should handle version with trailing slash", () => {
      const r = new Relay(mockResource, `${mockVersion}/`, mockHost);
      expect(r.buildServiceUrl()).toBe(`${mockHost}/${mockVersion}/${mockResource}`);
    });

    test("should handle resource with trailing slash", () => {
      const r = new Relay(`${mockResource}/`, mockVersion, mockHost);
      expect(r.buildServiceUrl()).toBe(`${mockHost}/${mockVersion}/${mockResource}`);
    });

    test("should handle all parts with trailing slashes", () => {
      const r = new Relay(`${mockResource}/`, `${mockVersion}/`, `${mockHost}/`);
      expect(r.buildServiceUrl()).toBe(`${mockHost}/${mockVersion}/${mockResource}`);
    });
    
    test("should handle null host, version, and resource", () => {
      // Assuming global.RELAY is defined as in the "should handle an empty resource" test
      // If not, this test might need adjustment or global.RELAY setup
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { HOST: "http://default.host", VERSION: "v0" }; // This global is for default params if version/host are undefined
      const r = new Relay(null, null, null); // Explicitly passing null uses null, not defaults
      expect(r.buildServiceUrl()).toBe("/"); 
      global.RELAY = originalGlobalRelay; // Restore
    });
    
    test("should handle empty string version", () => {
      const r = new Relay(mockResource, "", mockHost);
      expect(r.buildServiceUrl()).toBe(`${mockHost}/${mockResource}`);
    });

    test("should handle null version", () => {
      const r = new Relay(mockResource, null, mockHost);
      expect(r.buildServiceUrl()).toBe(`${mockHost}/${mockResource}`);
    });

    test("should handle empty string host", () => {
      // Assuming global.RELAY.HOST will be used if host is empty, based on constructor defaults
      // This depends on how RELAY.HOST is defined or mocked.
      // For this test, let's assume RELAY.HOST is 'https://api.example.com' if not overridden
      const originalGlobalRelay = global.RELAY;
      // If host is explicitly "", it's used as "", doesn't fall back to global.RELAY.HOST from default param
      global.RELAY = { HOST: "https://someother.host", VERSION: "vX" }; 
      const rWithEmptyHost = new Relay(mockResource, mockVersion, ""); // host is ""
      expect(rWithEmptyHost.buildServiceUrl()).toBe(`/${mockVersion}/${mockResource}`); // host part is empty
      global.RELAY = originalGlobalRelay; // Restore
    });

    test("should use default RELAY.HOST and RELAY.VERSION if host/version are undefined", () => {
      const originalGlobalRelay = global.RELAY;
      global.RELAY = { HOST: "http://global.host", VERSION: "globalV" };
      const r = new Relay(mockResource, undefined, undefined); // version and host are undefined, should use defaults
      expect(r.buildServiceUrl()).toBe(`http://global.host/globalV/${mockResource}`);
      global.RELAY = originalGlobalRelay;
    });
  });
});
