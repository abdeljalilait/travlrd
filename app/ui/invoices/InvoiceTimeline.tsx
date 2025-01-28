"use client";

import { updateInvoiceStatus } from "@/app/lib/actions";
import { InvoiceLogs } from "@/app/lib/definitions";
import dayjs from "dayjs";
import { Button, Timeline } from "flowbite-react";

export function InvoiceLogsTimeline({
  invoiceLogs,
}: {
  invoiceLogs: InvoiceLogs[];
}) {
  return (
    <Timeline>
      {invoiceLogs.map((log, index) => {
        return (
          <Timeline.Item key={index}>
            <Timeline.Point />
            <Timeline.Content>
              <Timeline.Time>
                {dayjs(log.date).format("MMMM D, YYYY h:mm A	")}
              </Timeline.Time>
              <Timeline.Body>
                {log.email} update this invoice from {log.old_status} to{" "}
                {log.new_status}
              </Timeline.Body>
              {index === 0 ? (
                <Button
                  onClick={() => {
                    updateInvoiceStatus(log.invoice_id, log.old_status);
                  }}
                  color="gray"
                >
                  Restore
                </Button>
              ) : null}
            </Timeline.Content>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}
