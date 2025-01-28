import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/invoices/table";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import { lusitana } from "@/app/ui/fonts";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";
import { fetchInvoicesPages } from "@/app/lib/data";
import { Metadata } from "next";
import { InvoiceStatusObject } from "@/app/lib/definitions";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    status?: string;
    page?: string;
  }>;
}) {
  // const cookiesStore = await cookies();
  // const lastTab = cookiesStore.get("lastTab");
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const statusQuery = searchParams?.status || "";
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchInvoicesPages({ query, status: statusQuery });

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <ul className="mt-4 flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
          <li className="me-2">
            <Link
              href={`/dashboard/invoices?status=`}
              aria-current="page"
              className={`inline-block p-4 text-blue-600 ${
                !statusQuery ? "bg-gray-100" : ""
              }  rounded-t-lg active dark:bg-gray-800 dark:text-blue-500`}
            >
              All
            </Link>
          </li>
          {Object.values(InvoiceStatusObject).map((status, index) => {
            return (
              <li key={index} className="me-2">
                <Link
                  href={`/dashboard/invoices?status=${status}`}
                  aria-current="page"
                  className={`inline-block p-4 text-blue-600 ${
                    statusQuery === status ? "bg-gray-100" : ""
                  } rounded-t-lg active dark:bg-gray-800 dark:text-blue-500`}
                >
                  {status}
                </Link>
              </li>
            );
          })}
        </ul>
        <Table status={statusQuery} query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
