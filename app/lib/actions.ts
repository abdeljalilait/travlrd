"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import { type INVOICE_STATUS, InvoiceStatusObject } from "./definitions";
import { fetchInvoiceById } from "./data";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(
    [
      InvoiceStatusObject.overdue,
      InvoiceStatusObject.paid,
      InvoiceStatusObject.pending,
      InvoiceStatusObject.canceled,
    ],
    {
      invalid_type_error: "Please select an invoice status.",
    }
  ),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }
  const invoice = await fetchInvoiceById(id);

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    if (invoice.status !== status) {
      // create logs
      await createInvoiceStatusLogs({
        id,
        old_status: invoice.status,
        new_status: status,
      });
    }
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoiceStatus(id: string, status: INVOICE_STATUS) {
  try {
    const invoice = await fetchInvoiceById(id);
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
    if (invoice.status !== status) {
      // create logs
      await createInvoiceStatusLogs({
        id,
        old_status: invoice.status,
        new_status: status,
      });
    }
    revalidatePath("/dashboard/invoices");
  } catch (error) {
    throw new Error("could not update invoice status");
  }
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}

// creates invoice status logs
export async function createInvoiceStatusLogs({
  id,
  old_status,
  new_status,
}: {
  id: string;
  old_status: INVOICE_STATUS;
  new_status: INVOICE_STATUS;
}) {
  try {
    //       invoice_id UUID NOT NULL,
    //       old_status VARCHAR(255) NOT NULL,
    //       new_status VARCHAR(255) NOT NULL,
    //       email TEXT NOT NULL UNIQUE,
    //       date TIMESTAMP NOT NULL
    const date = new Date().toUTCString()
    const session = await auth();
    if (session?.user) {
      const res = await sql`
      INSERT INTO invoice_logs (invoice_id, old_status, new_status, email, date)
      VALUES (${id}, ${old_status}, ${new_status},${session.user.email}, ${date})
    `;
      console.log(res);
    }
  } catch (error) {
    console.log(error);
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
