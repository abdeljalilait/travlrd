"use client";

import {
  InvoiceStatusObject,
  type INVOICE_STATUS,
} from "@/app/lib/definitions";
import { Dropdown } from "flowbite-react";

export default function InvoiceStatus({
  invoiceId,
  status,
  updateInvoiceStatus,
}: {
  invoiceId: string;
  status: INVOICE_STATUS;
  updateInvoiceStatus(id: string, status: INVOICE_STATUS): Promise<void>;
}) {
  return (
    <Dropdown size="xs" color="blue" label={status}>
      {Object.values(InvoiceStatusObject)
        .filter((_status) => status !== _status)
        .map((_status, index) => (
          <Dropdown.Item
            onClick={() => {
              updateInvoiceStatus(invoiceId, _status);
            }}
            key={index}
          >
            {_status}
          </Dropdown.Item>
        ))}
    </Dropdown>
  );
}
