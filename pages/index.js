import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

import { createClient } from "../prismicio";
import { list } from "postcss";
import { useState, useEffect } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import cx from "classnames";

import "react-loading-skeleton/dist/skeleton.css";
let counter = 0;
let listDocuments = [];
let brokenInterLinks = [];
const checkDoc = async ({ data }) => {
  // Check static fields
  checkFields(data);

  data.body.forEach((slice) => {
    // Check non-repeatable fields on each Slice
    checkFields(slice);

    slice.items.forEach((item) => {
      // Check repeatable fields on each Slice
      checkFields(item);
    });
  });
};

const checkFields = (docOrSlice) => {
  // Iterate over fields
  for (const field in docOrSlice) {
    let f = docOrSlice[field];
    // First check if the field is a broken link
    if (isBrokenLink(f)) null;
    // Then check if the field is Rich Text
    else if (isRichText(f)) {
      checkRichText(f);
    }
    // Check if the field might be a group
    else if (Array.isArray(f)) {
      // If field is a group, run recursively
      checkFields(f);
    }
  }
};

const checkRichText = (rtf) => {
  // Iterate over each Rich Text block
  // console.log(rtf, 'rtf')
  if (typeof rtf != "object") {
    rtf.forEach((block) => {
      // Iterate over spans for each block
      block.spans.forEach((span) => {
        // Check if the span contains a broken link
        if (span.type === "hyperlink") isBrokenLink(span.data);
      });
    });
  }
};

const isBrokenLink = (link) => {
  // Check if the link is broken
  if (link && link.isBroken) {
    // Format URL to open doc in repository
    let url = `https://${process.env.NEXT_PUBLIC_REPO_NAME}.prismic.io/documents~b=working&c=published&l=${lang}/${id}/`;
    counter++;
    listDocuments.push({ id, uid, customType, lang, url, counter });
    return true;
  }
};

const isRichText = (field) => {
  const list = field;
  const recursivelyFindKeyValue = (key, keyValue, list) => {
    console.log("Searching list: ", list);

    for (let i = 0; i < list.length; i++) {
      const item = list[i];

      for (const key of Object.keys(item)) {
        //check if its array of more options, search it
        if (Array.isArray(item[key])) {
          console.log("child array found, searching", item);
          const res = recursivelyFindKeyValue(key, keyValue, item[key]);
          if (res.found === true) return res;
        }
        //Test the keyValue
        else if (item[key] === keyValue) {
          //found, return the list
          console.log("found ", keyValue);
          return { found: true, containingArray: list };
        }
      }
    }

    return { found: false, containingArray: [] };
  };

  const result = Array.isArray(field)
    ? field.filter((e) => e.slice_type === "rich_text_area")
    : [];

  // https://stackoverflow.com/questions/71709477/find-deeply-nested-object-by-id

  function findByType(array, type) {
    if (Array.isArray(array) && array.length > 0) {
      for (const item of array) {
        if (item.primary.content) {
          for (const link of item.primary.content) {
            const richElementTypes = [
              "paragraph",
              "heading1",
              "heading2",
              "heading3",
              "heading4",
            ];
            if (richElementTypes.includes(link.type) && link.spans.length > 0) {
              for (const k of link.spans) {
                if (k.type === "hyperlink" && k.data.type === "broken_type") {
                  let url = `https://${process.env.NEXT_PUBLIC_REPO_NAME}.prismic.io/documents~b=working&c=published&l=${lang}/${id}/`;
                  counter++;
                  brokenInterLinks.push({
                    k,
                    link,
                    id,
                    counter,
                    uid,
                    customType,
                    lang,
                    url,
                  });
                  console.log(link, id);
                }
              }
            }
          }
        }
        if (item.type === type) return item;
        if (item.children?.length) {
          console.log(true);
          const innerResult = findByType(item.children, type);
          if (innerResult) return innerResult;
        }
      }
    }
  }

  const foundItem = findByType(result, "broken_type");
  if (foundItem != undefined && foundItem.length > 0) {
    console.log(foundItem);
    typeof foundItem;
    // interWordsBroken.push(foundItem)
  }
  if (field && Array.isArray(field)) return true;
};

// To store the UID of each do
let uid,
  customType,
  id,
  lang = undefined;

const LineItems = (props) => {
  const [loading, setLoading] = useState(false);
  return (
    <tbody className="divide-y divide-gray-200 bg-white">
      {console.log(
        Object.hasOwn(props.documents, "uid"),
        "outside",
        props.documents
      )}
      {props.documents.map((document) => (
        <tr key={document.counter}>
          {console.log(Object.hasOwn(document, "link"), "inside")}
          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
            {loading ? <Skeleton /> : document.counter}
          </td>
          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
            {loading ? <Skeleton /> : document.uid}
          </td>
          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
            {loading ? (
              <Skeleton />
            ) : (
              <a
                className="text-brand-purple hover:text-indigo-900"
                href={document.url}
                target="_blank"
              >
                {document.id}
              </a>
            )}
          </td>

          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
            {loading ? <Skeleton /> : document.customType}
          </td>
          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
            {loading ? <Skeleton /> : document.lang}
          </td>

          {Object.hasOwn(document, "link") && (
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {loading ? (
                <Skeleton />
              ) : (
                <div class="flex">
                  <div className="w-1/2 pr-4 border-r">
                    <dt class="text-sm font-medium text-gray-500">Link text</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {document.link.text}
                    </dd>
                  </div>
                  <div className="w-1/2 pl-4">
                    <dt class="text-sm font-medium text-gray-500">Text type</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {document.link.type}
                    </dd>
                  </div>
                </div>
              )}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
};

const webDomainDetection = (props) => {
  let domain;
  domain =
    props === "brightworld"
      ? "brightworldguardianships.com"
      : "brightworld.co.uk";
  return domain;
};
const THead = (props) => {
  const listHeads = props.heads.map((head, key) => (
    <th
      key={key}
      scope="col"
      className={cx(
        "text-left",
        "text-sm",
        "font-semibold",
        "text-gray-900",
        "py-3.5",
        {
          "px-3": key > 0,
          "pl-4": key === 0,
          "pr-3": key === 0,
          "sm:pl-6": key === 0,
        }
      )}
    >
      {head}
    </th>
  ));
  return (
    <thead className="bg-gray-50">
      <tr>{listHeads}</tr>
    </thead>
  );
};

export default function Home() {
  const headsDocuments = ["Number", "UID", "ID", "Page type", "Language"];
  const headsInterwords = [
    "Number",
    "UID",
    "ID",
    "Page type",
    "Language",
    "Inlinked",
  ];

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const client = createClient();
    setLoading(true);
    client
      .dangerouslyGetAll({
        lang: "*",
      })
      // .then((res) => res)
      .then((data) => {
        setData(data);
        data.map((doc) => {
          // Update uid var while checking each doc
          uid = doc.uid;
          customType = doc.type;
          id = doc.id;
          lang = doc.lang;
          checkDoc(doc);
        });
        setLoading(false);
      });
  }, []);
  return (
    <div className={styles.container}>
      <Head>
        <title>{webDomainDetection(process.env.NEXT_PUBLIC_REPO_NAME)}</title>
        <meta name="description" content="Bright World Broken Links" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-brand-purple py-4 px-4">
        <div className="container mx-auto md:px-6 lg:px-8 mb-6">
          <img src="/logo.svg" className="h-16 w-16" />
        </div>
        <header className="sm:flex sm:items-center mx-auto container md:px-6 lg:px-8">
          <div className="sm:flex-auto py-6">
            <h1 className="text-3xl font-bold text-white text-left">
              Broken Link List
            </h1>
            {loading ? (
              <Skeleton width="75%" height={18} />
            ) : (
              <p className="mt-2 text-sm text-gray-100">
                A list of all <pre className="inline">{counter}</pre> broken
                links (excluding in-linked words) in your Prismic documents for
                <pre className="ml-2 inline px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 h-full cursor-pointer underline-offset-8">
                  <a
                    href={`https://${process.env.NEXT_PUBLIC_REPO_NAME}.prismic.io`}
                  >{`${process.env.NEXT_PUBLIC_REPO_NAME}.prismic.io`}</a>
                </pre>
                <span className="mx-1">(</span>
                <a
                  href={`https://${webDomainDetection(
                    process.env.NEXT_PUBLIC_REPO_NAME
                  )}`}
                >
                  {webDomainDetection(process.env.NEXT_PUBLIC_REPO_NAME)}
                </a>
                <span className="mx-1">).</span>
              </p>
            )}
          </div>
        </header>
      </div>
      <main>
        {loading ? (
          <span class="flex justify-center items-center mt-6">
            <svg
              class="animate-spin -ml-1 mr-3 h-8 w-8 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading
          </span>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mt-8 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  {brokenInterLinks.length > 0 ? (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Broken In-linked Words
                      </h2>
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-8">
                        <table className="min-w-full divide-y divide-gray-300">
                          <THead heads={headsInterwords} />
                          <LineItems documents={brokenInterLinks} />
                        </table>
                      </div>
                    </div>
                  ) : (
                    <span className="flex justify-center text-sm text-gray-700 pt-2">
                      No broken inlinked words found
                    </span>
                  )}
                  {listDocuments.length > 0 ? (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Document Broken Links
                      </h2>
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <THead heads={headsDocuments} />
                          <LineItems documents={listDocuments} />
                        </table>
                      </div>
                    </div>
                  ) : (
                    <span className="flex justify-center text-sm text-gray-700 pt-2">
                      No broken links found
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
