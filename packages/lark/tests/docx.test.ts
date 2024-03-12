import { test, describe, expect } from "vitest";
import * as mdast from "mdast";
import {
  BlockType,
  mergeListItems,
  mergePhrasingContents,
  transformOperationsToPhrasingContents,
  transformer,
} from "../src/docx";

describe("mergeListItems()", () => {
  test("simple example", () => {
    const result = mergeListItems([
      {
        type: "blockquote",
        children: [],
      },
      {
        type: "listItem",
        children: [],
      },
      {
        type: "listItem",
        data: {
          seq: 1,
        },
        children: [],
      },
      {
        type: "listItem",
        checked: true,
        children: [],
      },
      {
        type: "listItem",
        checked: false,
        children: [],
      },
      {
        type: "blockquote",
        children: [],
      },
      {
        type: "listItem",
        data: {
          seq: 2,
        },
        children: [],
      },
    ]);
    const expectedResult: mdast.Nodes[] = [
      {
        type: "blockquote",
        children: [],
      },
      {
        type: "list",
        children: [
          {
            type: "listItem",
            children: [],
          },
        ],
      },
      {
        type: "list",
        ordered: true,
        start: 1,
        children: [
          {
            type: "listItem",
            data: {
              seq: 1,
            },
            children: [],
          },
        ],
      },
      {
        type: "list",
        children: [
          {
            type: "listItem",
            checked: true,
            children: [],
          },
          {
            type: "listItem",
            checked: false,
            children: [],
          },
        ],
      },
      {
        type: "blockquote",
        children: [],
      },
      {
        type: "list",
        ordered: true,
        start: 2,
        children: [
          {
            type: "listItem",
            data: {
              seq: 2,
            },
            children: [],
          },
        ],
      },
    ];
    expect(result).toStrictEqual(expectedResult);
  });
});

describe("mergePhrasingContents()", () => {
  test("simple example", () => {
    const result = mergePhrasingContents([
      {
        type: "strong",
        children: [],
      },
      {
        type: "emphasis",
        children: [
          {
            type: "text",
            value: "a",
          },
        ],
      },
      {
        type: "emphasis",
        children: [
          {
            type: "text",
            value: "b",
          },
        ],
      },
      {
        type: "link",
        url: "https://www.baidu.com",
        children: [
          {
            type: "delete",
            children: [
              {
                type: "strong",
                children: [
                  {
                    type: "text",
                    value: "a",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "link",
        url: "https://www.baidu.com",
        children: [
          {
            type: "strong",
            children: [
              {
                type: "text",
                value: "a",
              },
            ],
          },
        ],
      },
    ]);
    const expectedResult: mdast.PhrasingContent[] = [
      {
        type: "strong",
        children: [],
      },
      {
        type: "emphasis",
        children: [
          {
            type: "text",
            value: "ab",
          },
        ],
      },
      {
        type: "link",
        url: "https://www.baidu.com",
        children: [
          {
            type: "delete",
            children: [
              {
                type: "strong",
                children: [
                  {
                    type: "text",
                    value: "a",
                  },
                ],
              },
            ],
          },
          {
            type: "strong",
            children: [
              {
                type: "text",
                value: "a",
              },
            ],
          },
        ],
      },
    ];
    expect(result).toStrictEqual(expectedResult);
  });
});

describe("transformOperationsToPhrasingContents()", () => {
  describe("code span", () => {
    test("simple code span", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            insert: "code",
            attributes: {
              inlineCode: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([{ type: "inlineCode", value: "code" }]);
    });

    test("code span in strong emphasis", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            insert: "a",
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "b",
            attributes: {
              bold: "true",
              inlineCode: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "c",
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [
            { type: "text", value: "a" },
            { type: "inlineCode", value: "b" },
            { type: "text", value: "c" },
          ],
        },
      ]);
    });

    test("code span range intersect strong emphasis range", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "a",
          },
          {
            insert: "b",
            attributes: {
              inlineCode: "true",
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "c",
            attributes: {
              inlineCode: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [
            {
              type: "text",
              value: "a",
            },
            {
              type: "inlineCode",
              value: "b",
            },
          ],
        },
        {
          type: "inlineCode",
          value: "c",
        },
      ]);
    });
  });

  describe("emphasis and strong emphasis", () => {
    test("simple emphasis", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            insert: "emphasis",
            attributes: {
              italic: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "emphasis",
          children: [{ type: "text", value: "emphasis" }],
        },
      ]);
    });

    test("simple strong emphasis", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            insert: "strong emphasis",
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [{ type: "text", value: "strong emphasis" }],
        },
      ]);
    });

    test("emphasis in strong emphasis", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "a",
          },
          {
            insert: "b",
            attributes: {
              italic: "true",
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "c",
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [
            {
              type: "text",
              value: "a",
            },
            {
              type: "emphasis",
              children: [{ type: "text", value: "b" }],
            },
            {
              type: "text",
              value: "c",
            },
          ],
        },
      ]);
    });

    test("emphasis range intersect strong emphasis range", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "a",
          },
          {
            insert: "b",
            attributes: {
              italic: "true",
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "c",
            attributes: {
              italic: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [
            { type: "text", value: "a" },
            { type: "emphasis", children: [{ type: "text", value: "b" }] },
          ],
        },
        {
          type: "emphasis",
          children: [
            {
              type: "text",
              value: "c",
            },
          ],
        },
      ]);
    });
  });

  describe("delete", () => {
    test("simple delete", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            insert: "a",
            attributes: {
              strikethrough: "true",
              author: "7096007617544896513",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "delete",
          children: [{ type: "text", value: "a" }],
        },
      ]);
    });

    test("nesting are possible", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "a",
          },
          {
            attributes: {
              italic: "true",
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "b",
          },
          {
            insert: "c",
            attributes: {
              strikethrough: "true",
              italic: "true",
              bold: "true",
              author: "7096007617544896513",
            },
          },
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "d",
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [
            {
              type: "text",
              value: "a",
            },
            {
              type: "emphasis",
              children: [
                {
                  type: "text",
                  value: "b",
                },
                { type: "delete", children: [{ type: "text", value: "c" }] },
              ],
            },
            {
              type: "text",
              value: "d",
            },
          ],
        },
      ]);
    });
  });

  describe("link", () => {
    test("simple link", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            insert: "a",
            attributes: {
              "clientside-link-underline": "true",
              author: "7096007617544896513",
              link: "https%3A%2F%2Fwww.baidu.com",
            },
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "link",
          url: "https://www.baidu.com",
          children: [{ type: "text", value: "a" }],
        },
      ]);
    });
  });

  describe("mark priority", () => {
    test("strong > emphasis", () => {
      expect(
        transformOperationsToPhrasingContents([
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "ab",
          },
          {
            insert: "c",
            attributes: {
              bold: "true",
              italic: "true",
              author: "7096007617544896513",
            },
          },
          {
            attributes: {
              bold: "true",
              author: "7096007617544896513",
            },
            insert: "de",
          },
          {
            insert: "\n",
            attributes: {
              fixEnter: "true",
            },
          },
        ])
      ).toStrictEqual([
        {
          type: "strong",
          children: [
            { type: "text", value: "ab" },
            {
              type: "emphasis",
              children: [{ type: "text", value: "c" }],
            },
            { type: "text", value: "de" },
          ],
        },
      ]);
    });
  });
});

describe("transformer.transform()", () => {
  describe("divider", () => {
    test("one divider", () => {
      expect(
        transformer.transform({
          type: BlockType.PAGE,
          snapshot: {
            type: BlockType.PAGE,
          },
          children: [
            {
              type: BlockType.DIVIDER,
              children: [],
              snapshot: {
                type: BlockType.DIVIDER,
              },
            },
          ],
        }).root
      ).toStrictEqual({
        type: "root",
        children: [
          {
            type: "thematicBreak",
          },
        ],
      });
    });

    test("two divider", () => {
      expect(
        transformer.transform({
          type: BlockType.PAGE,
          snapshot: {
            type: BlockType.PAGE,
          },
          children: [
            {
              type: BlockType.DIVIDER,
              children: [],
              snapshot: {
                type: BlockType.DIVIDER,
              },
            },
            {
              type: BlockType.DIVIDER,
              children: [],
              snapshot: {
                type: BlockType.DIVIDER,
              },
            },
          ],
        }).root
      ).toStrictEqual({
        type: "root",
        children: [
          {
            type: "thematicBreak",
          },
          {
            type: "thematicBreak",
          },
        ],
      });
    });
  });

  describe("heading", () => {
    test("heading one", () => {
      expect(
        transformer.transform({
          type: BlockType.PAGE,
          snapshot: {
            type: BlockType.PAGE,
          },
          children: [
            {
              type: BlockType.HEADING1,
              depth: 1,
              snapshot: {
                type: BlockType.HEADING1,
              },
              zoneState: {
                allText: "",
                content: {
                  ops: [
                    {
                      insert: "heading one",
                      attributes: {},
                    },
                  ],
                },
              },
              children: [],
            },
          ],
        }).root
      ).toStrictEqual({
        type: "root",
        children: [
          {
            type: "heading",
            depth: 1,
            children: [
              {
                type: "text",
                value: "heading one",
              },
            ],
          },
        ],
      });
    });
  });

  describe("code", () => {
    test("simple example", () => {
      const { root } = transformer.transform({
        type: BlockType.PAGE,
        snapshot: {
          type: BlockType.PAGE,
        },
        children: [
          {
            type: BlockType.CODE,
            language: "JavaScript",
            snapshot: {
              type: BlockType.CODE,
            },
            zoneState: {
              allText: "const\n",
              content: {
                ops: [],
              },
            },
            children: [],
          },
        ],
      });
      const expectedRoot: mdast.Root = {
        type: "root",
        children: [
          {
            type: "code",
            lang: "javascript",
            value: "const",
          },
        ],
      };
      expect(root).toStrictEqual(expectedRoot);
    });
  });

  describe("blockquote", () => {
    test("simple example", () => {
      const { root } = transformer.transform({
        type: BlockType.PAGE,
        snapshot: {
          type: BlockType.PAGE,
        },
        children: [
          {
            type: BlockType.QUOTE_CONTAINER,
            snapshot: {
              type: BlockType.QUOTE_CONTAINER,
            },
            children: [
              {
                type: BlockType.ORDERED,
                snapshot: {
                  type: BlockType.ORDERED,
                  seq: "1",
                },
                zoneState: {
                  allText: "",
                  content: {
                    ops: [
                      {
                        insert: "list item 1",
                        attributes: {},
                      },
                    ],
                  },
                },
                children: [],
              },
              {
                type: BlockType.ORDERED,
                snapshot: {
                  type: BlockType.ORDERED,
                  seq: "2",
                },
                zoneState: {
                  allText: "",
                  content: {
                    ops: [
                      {
                        insert: "list item 2",
                        attributes: {},
                      },
                    ],
                  },
                },
                children: [],
              },
              {
                type: BlockType.DIAGRAM,
                snapshot: {
                  type: BlockType.DIAGRAM,
                },
                children: [],
              },
            ],
          },
        ],
      });
      const expectedRoot: mdast.Root = {
        type: "root",
        children: [
          {
            type: "blockquote",
            children: [
              {
                type: "list",
                ordered: true,
                start: 1,
                children: [
                  {
                    type: "listItem",
                    data: {
                      seq: 1,
                    },
                    children: [
                      {
                        type: "paragraph",
                        children: [
                          {
                            type: "text",
                            value: "list item 1",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    data: {
                      seq: 2,
                    },
                    children: [
                      {
                        type: "paragraph",
                        children: [
                          {
                            type: "text",
                            value: "list item 2",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(root).toStrictEqual(expectedRoot);
    });
  });

  describe("list", () => {
    test("simple example", () => {
      const { root } = transformer.transform({
        type: BlockType.PAGE,
        snapshot: {
          type: BlockType.PAGE,
        },
        children: [
          {
            type: BlockType.BULLET,
            snapshot: {
              type: BlockType.BULLET,
            },
            zoneState: {
              allText: "",
              content: {
                ops: [
                  {
                    insert: "a",
                    attributes: {},
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: BlockType.BULLET,
            snapshot: {
              type: BlockType.BULLET,
            },
            zoneState: {
              allText: "",
              content: {
                ops: [
                  {
                    insert: "b",
                    attributes: {},
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: BlockType.ORDERED,
            snapshot: {
              type: BlockType.ORDERED,
              seq: "2",
            },
            zoneState: {
              allText: "",
              content: {
                ops: [
                  {
                    insert: "one",
                    attributes: {},
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: BlockType.ORDERED,
            snapshot: {
              type: BlockType.ORDERED,
              seq: "3",
            },
            zoneState: {
              allText: "",
              content: {
                ops: [
                  {
                    insert: "two",
                    attributes: {},
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: BlockType.TODO,
            snapshot: {
              type: BlockType.TODO,
            },
            zoneState: {
              allText: "",
              content: {
                ops: [
                  {
                    insert: "task one",
                    attributes: {},
                  },
                ],
              },
            },
            children: [],
          },
        ],
      });
      const expectedRoot: mdast.Root = {
        type: "root",
        children: [
          {
            type: "list",
            children: [
              {
                type: "listItem",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        value: "a",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        value: "b",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "list",
            ordered: true,
            start: 2,
            children: [
              {
                type: "listItem",
                data: {
                  seq: 2,
                },
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        value: "one",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                data: {
                  seq: 3,
                },
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        value: "two",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "list",
            children: [
              {
                type: "listItem",
                checked: false,
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        value: "task one",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(root).toStrictEqual(expectedRoot);
    });
  });
});
