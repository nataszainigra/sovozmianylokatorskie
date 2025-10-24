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
        comment: item.comment || null,
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
        comment: item.comment || null,
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
      .select('status, messages');

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    // Count unread client messages
    let unreadMessages = 0;
    requests.forEach((r: any) => {
      if (r.messages && Array.isArray(r.messages)) {
        unreadMessages += r.messages.filter((msg: any) =>
          msg.author === 'client' && !msg.read
        ).length;
      }
    });

    return {
      total: requests.length,
      nowy: requests.filter((r: any) => r.status === 'nowy').length,
      wTrakcie: requests.filter((r: any) => r.status === 'w trakcie').length,
      zaakceptowany: requests.filter((r: any) => r.status === 'zaakceptowany').length,
      odrzucony: requests.filter((r: any) => r.status === 'odrzucony').length,
      oczekujeNaAkceptacje: requests.filter((r: any) => r.status === 'oczekuje na akceptację klienta').length,
      wymagaDoprecyzowania: requests.filter((r: any) => r.status === 'wymaga doprecyzowania').length,
      unreadMessages,
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
      comment: item.comment || undefined,
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
      messages: dbRequest.messages || [],
      clientToken: dbRequest.client_token,
      quoteSentAt: dbRequest.quote_sent_at,
      quoteAcceptedAt: dbRequest.quote_accepted_at,
      items,
    };
  }

  // Message management methods
  async addMessage(
    requestId: string,
    author: 'client' | 'technical_department',
    authorName: string,
    content: string,
  ): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    // Get current request
    const request = await this.getRequestById(requestId);
    if (!request) {
      return null;
    }

    const messageId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 11);
    const newMessage = {
      id: messageId,
      author,
      authorName,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updatedMessages = [...(request.messages || []), newMessage];

    // Update request with new message
    const { data, error } = await client
      .from('change_requests')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*, change_items(*)')
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbToSavedRequest(data);
  }

  async markMessagesAsRead(requestId: string, author: 'client' | 'technical_department'): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    const request = await this.getRequestById(requestId);
    if (!request || !request.messages) {
      return request;
    }

    // Mark messages from opposite author as read
    const updatedMessages = request.messages.map(msg => {
      if (msg.author !== author && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });

    const { data, error } = await client
      .from('change_requests')
      .update({
        messages: updatedMessages,
      })
      .eq('id', requestId)
      .select('*, change_items(*)')
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbToSavedRequest(data);
  }

  async generateClientToken(requestId: string): Promise<string | null> {
    const client = this.supabase.getClient();

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { error } = await client
      .from('change_requests')
      .update({
        client_token: token,
      })
      .eq('id', requestId);

    if (error) {
      return null;
    }

    return token;
  }

  async getRequestByToken(token: string): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    const { data: request, error } = await client
      .from('change_requests')
      .select('*, change_items(*)')
      .eq('client_token', token)
      .single();

    if (error || !request) {
      return null;
    }

    return this.mapDbToSavedRequest(request);
  }

  async markQuoteSent(requestId: string): Promise<SavedRequest | null> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('change_requests')
      .update({
        quote_sent_at: new Date().toISOString(),
        status: 'oczekuje na akceptację klienta',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*, change_items(*)')
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbToSavedRequest(data);
  }
}
