import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { products } from '@/lib/products';

// Define the path to the data directory and waitlist file
const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

// Interface for waitlist entry
interface WaitlistEntry {
    email: string;
    productSlug: string;
    createdAt: string;
    source: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, productSlug } = body;

        // 1. Basic Validation
        if (!email || !productSlug || typeof email !== 'string' || typeof productSlug !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // 2. Product Validation
        const productExists = products.some((p) => p.slug === productSlug);
        if (!productExists) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Read existing waitlist
        let waitlist: WaitlistEntry[] = [];
        if (fs.existsSync(WAITLIST_FILE)) {
            try {
                const fileContent = fs.readFileSync(WAITLIST_FILE, 'utf-8');
                waitlist = JSON.parse(fileContent);
            } catch (error) {
                // If file is corrupt or empty, start fresh but log error
                console.error('Error reading waitlist file:', error);
                waitlist = [];
            }
        }

        // 3. Deduplication (Idempotency)
        const alreadyExists = waitlist.some(
            (entry) => entry.email === email && entry.productSlug === productSlug
        );

        if (alreadyExists) {
            // Return 200 OK as if it succeeded (common practice to avoid leaking info or confusing user)
            return NextResponse.json({ message: 'Already on waitlist', status: 'exists' }, { status: 200 });
        }

        // 4. Add new entry
        const newEntry: WaitlistEntry = {
            email,
            productSlug,
            createdAt: new Date().toISOString(),
            source: 'genesis_drop01',
        };

        waitlist.push(newEntry);

        // 5. Write safely
        fs.writeFileSync(WAITLIST_FILE, JSON.stringify(waitlist, null, 2));

        return NextResponse.json({ message: 'Added to waitlist', status: 'success' }, { status: 200 });

    } catch (error) {
        console.error('Waitlist API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
