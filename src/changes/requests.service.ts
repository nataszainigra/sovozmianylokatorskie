import { Injectable } from '@nestjs/common';
import { SavedRequest, ChangeRequest, RequestStatus, ChangeItem } from '../common/types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async saveRequest(request: ChangeRequest, estimatedCost: any): Promise<SavedRequest> {
    const client = this.supabase.getClient();

    const id = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    // Insert request
    const { data: requestData, error: requestError } = await client
      .from('change_requests')
      .insert({
        id,
        buyer_name: request.buyerName,
        unit_number: request.unitNumber,
        email: request.email,
        phone: request.phone,
        address_street: request.addressStreet,
        address_zip: request.addressZip,
        address_city: request.addressCity,
        status: 'nowy',
        submitted_at: now,
        estimated_cost: estimatedCost,
        attachments: request.attachments || [],
      })
      .select()
      .single();

    if (requestError) {
      throw new Error(`Failed to save request: ${requestError.message}`);
    }

    // Insert items
    if (request.items && request.items.length > 0) {
      const itemsToInsert = request.items.map(item => ({
        request_id: id,
        room: item.room,
        branch: item.branch,
        code: item.code || null,
        description: item.description || null,
        unit: item.unit || null,
        qty: item.qty,
        unit_price: item.unitPrice || null,
        technical_analysis: item.technicalAnalysis || null,
      }));

      const { error: itemsError } = await client
        .from('change_items')
        .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(`Failed to save items: ${itemsError.message}`);
      }
    }

    return this.mapToSavedRequest(requestData, request.items);
  }

  async getAllRequests(): Promise<SavedRequest[]> {
    const client = this.supabase.getClient();

    const { data: requests, error: requestsError } = await client
      .from('change_requests')
      .select('*, change_items(*)')
      .order('submitted_at', { ascending: false });

    if (requestsError) {
      throw new Error(`Failed to get requests: ${requestsError.message}`);
    }

    return requests.map(req => this.mapDbToSavedRequest(req));
  }

  async getRequestById(id: string): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    const { data: request, error } = await client
      .from('change_requests')
      .select('*, change_items(*)')
      .eq('id', id)
      .single();

    if (error || !request) {
      return null;
    }

    return this.mapDbToSavedRequest(request);
  }

  async updateRequestStatus(id: string, status: RequestStatus, notes?: string): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: request, error } = await client
      .from('change_requests')
      .update(updateData)
      .eq('id', id)
      .select('*, change_items(*)')
      .single();

    if (error || !request) {
      return null;
    }

    return this.mapDbToSavedRequest(request);
  }

  async updateRequestItems(id: string, items: ChangeItem[], estimatedCost: any): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    // Delete existing items
    await client
      .from('change_items')
      .delete()
      .eq('request_id', id);

    // Insert new items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        request_id: id,
        room: item.room,
        branch: item.branch,
        code: item.code || null,
        description: item.description || null,
        unit: item.unit || null,
        qty: item.qty,
        unit_price: item.unitPrice || null,
        technical_analysis: item.technicalAnalysis || null,
      }));

      await client
        .from('change_items')
        .insert(itemsToInsert);
    }

    // Update request
    const { data: request, error } = await client
      .from('change_requests')
      .update({
        estimated_cost: estimatedCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, change_items(*)')
      .single();

    if (error || !request) {
      return null;
    }

    return this.mapDbToSavedRequest(request);
  }

  async getStats() {
    const client = this.supabase.getClient();

    const { data: requests, error } = await client
      .from('change_requests')
      .select('status');

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    return {
      total: requests.length,
      nowy: requests.filter((r: any) => r.status === 'nowy').length,
      wTrakcie: requests.filter((r: any) => r.status === 'w trakcie').length,
      zaakceptowany: requests.filter((r: any) => r.status === 'zaakceptowany').length,
      odrzucony: requests.filter((r: any) => r.status === 'odrzucony').length,
    };
  }

  // Helper methods
  private mapToSavedRequest(dbRequest: any, items: ChangeItem[]): SavedRequest {
    return {
      id: dbRequest.id,
      buyerName: dbRequest.buyer_name,
      unitNumber: dbRequest.unit_number,
      email: dbRequest.email,
      phone: dbRequest.phone,
      addressStreet: dbRequest.address_street,
      addressZip: dbRequest.address_zip,
      addressCity: dbRequest.address_city,
      status: dbRequest.status,
      submittedAt: dbRequest.submitted_at,
      updatedAt: dbRequest.updated_at,
      estimatedCost: dbRequest.estimated_cost,
      attachments: dbRequest.attachments || [],
      notes: dbRequest.notes,
      items,
    };
  }

  private mapDbToSavedRequest(dbRequest: any): SavedRequest {
    const items: ChangeItem[] = (dbRequest.change_items || []).map((item: any) => ({
      room: item.room,
      branch: item.branch,
      code: item.code || '',
      description: item.description || '',
      unit: item.unit || '',
      qty: item.qty,
      unitPrice: item.unit_price ? parseFloat(item.unit_price) : undefined,
      technicalAnalysis: item.technical_analysis || undefined,
    }));

    return {
      id: dbRequest.id,
      buyerName: dbRequest.buyer_name,
      unitNumber: dbRequest.unit_number,
      email: dbRequest.email,
      phone: dbRequest.phone,
      addressStreet: dbRequest.address_street,
      addressZip: dbRequest.address_zip,
      addressCity: dbRequest.address_city,
      status: dbRequest.status,
      submittedAt: dbRequest.submitted_at,
      updatedAt: dbRequest.updated_at,
      estimatedCost: dbRequest.estimated_cost,
      attachments: dbRequest.attachments || [],
      notes: dbRequest.notes,
      items,
    };
  }
}
