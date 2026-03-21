import { supabase } from '../lib/supabaseClient';

export async function checkCredits(userId: string, amount: number = 1): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return false;
    }

    return data.credits >= amount;
}

export async function deductCredits(
    userId: string,
    amount: number = 1,
    description: string = 'Realistic render generation'
): Promise<boolean> {
    const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_description: description,
    });

    if (error) {
        console.error('Error deducting credits:', error);
        return false;
    }

    return data === true;
}

export async function addCredits(
    userId: string,
    amount: number,
    type: 'purchase' | 'bonus' | 'refund' = 'purchase',
    description: string = 'Credit purchase'
): Promise<boolean> {
    const { data, error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: description,
    });

    if (error) {
        console.error('Error adding credits:', error);
        return false;
    }

    return data === true;
}

export async function getCreditTransactions(userId: string) {
    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data;
}
