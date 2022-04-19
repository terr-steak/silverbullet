import { flashNotification, getCurrentPage, reloadPage, save } from "plugos-silverbullet-syscall/editor";

import { readPage, writePage } from "plugos-silverbullet-syscall/space";
import { invokeFunction } from "plugos-silverbullet-syscall/system";
import { parseQuery } from "./engine";
import { replaceTemplateVars } from "../core/template";
import { queryRegex } from "./util";
import { dispatch } from "plugos-syscall/event";

async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (match: string, ...args: any[]) => Promise<string>
) {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match: string, ...args: any[]): string => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
    return "";
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift()!);
}

export async function updateMaterializedQueriesCommand() {
  const currentPage = await getCurrentPage();
  await save();
  await invokeFunction(
    "server",
    "updateMaterializedQueriesOnPage",
    currentPage
  );
  await reloadPage();
  await flashNotification("Updated materialized queries");
}

// Called from client, running on server
export async function updateMaterializedQueriesOnPage(pageName: string) {
  let { text } = await readPage(pageName);

  text = await replaceAsync(
    text,
    queryRegex,
    async (fullMatch, startQuery, query, body, endQuery) => {
      let parsedQuery = parseQuery(replaceTemplateVars(query, pageName));

      console.log("Parsed query", parsedQuery);
      // Let's dispatch an event and see what happens
      let results = await dispatch(
        `query:${parsedQuery.table}`,
        { query: parsedQuery, pageName: pageName },
        5000
      );
      if (results.length === 0) {
        return `${startQuery}\n${endQuery}`;
      } else if (results.length === 1) {
        return `${startQuery}\n${results[0]}\n${endQuery}`;
      } else {
        console.error("Too many query results", results);
        return fullMatch;
      }
    }
  );
  // console.log("New text", text);
  await writePage(pageName, text);
}