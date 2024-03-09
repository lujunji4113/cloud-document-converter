import { test, describe, expect } from "vitest";
import {
  BlockType,
  transformOperationsToPhrasingContents,
  transformer,
} from "../../src/lark/docx";

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

describe("divider", () => {
  test("one divider", () => {
    expect(
      transformer.transform({
        type: BlockType.PAGE,
        children: [
          {
            type: BlockType.DIVIDER,
            children: [],
          },
        ],
      }).node
    ).toStrictEqual({
      type: "root",
      children: [
        {
          type: "thematicBreak",
        },
      ],
    });
  });
});
