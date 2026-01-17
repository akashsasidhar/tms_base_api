import { ContactType } from '../../models';
import sequelize from '../../config/database';

export interface ContactTypeResponse {
  id: string;
  contact_type: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * ContactType Service
 */
export class ContactTypeService {
  /**
   * Get all contact types
   */
  static async getAllContactTypes(): Promise<ContactTypeResponse[]> {
    const contactTypes = await ContactType.findAll({
      where: {
        deleted_at: null,
        is_active: true,
      },
      order: [['contact_type', 'ASC']],
    });

    return contactTypes.map((ct) => ({
      id: ct.id,
      contact_type: ct.contact_type,
      is_active: ct.is_active,
      created_at: ct.created_at,
      updated_at: ct.updated_at,
    }));
  }

  /**
   * Create contact type
   */
  static async createContactType(
    name: string,
    createdBy?: string
  ): Promise<ContactTypeResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Check if contact type already exists
      const existing = await ContactType.findOne({
        where: {
          contact_type: name.toLowerCase(),
          deleted_at: null,
        },
        transaction,
      });

      if (existing) {
        await transaction.rollback();
        throw new Error('Contact type already exists');
      }

      const contactType = await ContactType.create(
        {
          contact_type: name.toLowerCase(),
          created_by: createdBy || null,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        id: contactType.id,
        contact_type: contactType.contact_type,
        is_active: contactType.is_active,
        created_at: contactType.created_at,
        updated_at: contactType.updated_at,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get contact type by ID
   */
  static async getContactTypeById(id: string): Promise<ContactTypeResponse | null> {
    const contactType = await ContactType.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!contactType) {
      return null;
    }

    return {
      id: contactType.id,
      contact_type: contactType.contact_type,
      is_active: contactType.is_active,
      created_at: contactType.created_at,
      updated_at: contactType.updated_at,
    };
  }
}
